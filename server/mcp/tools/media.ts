import { and, asc, count, desc, eq, ilike, like, not, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/postgres.js'
import { populateOne } from '../../db/refs.js'
import { media, newsroomPosts, teamMembers } from '../../db/schema/index.js'
import { NEWSROOM_REFS } from '../../services/newsroom.js'
import { deleteFromSpaces, keyFromPublicUrl, uploadToSpaces } from '../../services/s3.js'
import { downloadRemote } from '../../services/remoteDownload.js'
import { deleteMedia, ingestImage, previewMediaDelete, type MediaRow } from '../../services/media.js'
import type { ToolRegistrar } from '../registry.js'
import { invalid, notFound, ok, toolError } from '../results.js'
import {
  deletedOutput, dryRunInput, expectedUpdatedAtInput, folderInput, limitInput, objectIdInput, pagedOutput, pageInput, pageOf,
  recordOutput, sourceUrlInput, tagList, text,
} from '../schemas.js'
import { auditLog, updateRecord } from '../writes.js'

/* The media library and the upload tools. Validation, reuse, compensation and
   deletion rules live in services/media.ts, shared with the REST routes. */

/** Most items one bulk call processes; larger batches are split by the caller and resumed. */
export const MAX_BULK_ITEMS = 20
/** Wall-clock budget for one bulk call; items not started in time come back as `skipped`. */
const BULK_TIME_BUDGET_MS = 4 * 60 * 1000

function filenameFromUrl(url: string): string | undefined {
  try {
    return new URL(url).pathname.split('/').pop() || undefined
  } catch {
    return undefined
  }
}

function mediaSummary(row: MediaRow): Record<string, unknown> {
  return row as unknown as Record<string, unknown>
}

export function registerMediaTools(server: ToolRegistrar): void {
  server.tool('list_media', 'List the media library, newest first, with search, type, tag and folder filters. Returns { items, total, page, pages }.', {
    search: text(200).optional().describe('Match filename or alt text'),
    type: z.enum(['image', 'video', 'document']).optional().describe('MIME type family'),
    tag: text(60).optional(),
    folder: folderInput.optional(),
    page: pageInput,
    limit: limitInput,
  }, async (params) => {
    const filters: SQL[] = []
    if (params.search) {
      const pattern = `%${params.search}%`
      filters.push(or(ilike(media.filename, pattern), ilike(media.alt, pattern)) as SQL)
    }
    if (params.type === 'image') filters.push(like(media.mimeType, 'image/%'))
    else if (params.type === 'video') filters.push(like(media.mimeType, 'video/%'))
    else if (params.type === 'document') filters.push(not(like(media.mimeType, 'image/%')), not(like(media.mimeType, 'video/%')))
    if (params.tag) filters.push(sql`${media.tags} @> ARRAY[${params.tag}]::text[]`)
    if (params.folder) filters.push(eq(media.folder, params.folder))
    const where = filters.length > 0 ? and(...filters) : undefined
    const { page, limit, offset } = pageOf(params)
    const [items, [totals]] = await Promise.all([
      db.select().from(media).where(where).orderBy(desc(media.createdAt), asc(media._id)).offset(offset).limit(limit),
      db.select({ value: count() }).from(media).where(where),
    ])
    const total = Number(totals?.value ?? 0)
    return ok({ items, total, page, pages: Math.ceil(total / limit) })
  }, { outputSchema: pagedOutput('items') })

  server.tool('get_media', 'Get one media item by _id.', {
    id: objectIdInput.describe('The _id of the media item'),
  }, async ({ id }) => {
    const [row] = await db.select().from(media).where(eq(media._id, id)).limit(1)
    if (!row) throw notFound('Media')
    return ok(row)
  }, { outputSchema: recordOutput })

  server.tool('update_media', 'Update media metadata: alt text, tags, folder. The stored file does not move.', {
    id: objectIdInput.describe('The _id of the media item'),
    alt: text(500).optional(),
    tags: tagList.optional(),
    folder: folderInput.optional().describe('Library folder label'),
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ id, expectedUpdatedAt, ...patch }, context) => {
    const row = await updateRecord({ table: media, where: eq(media._id, id), label: 'Media', patch, expectedUpdatedAt })
    auditLog(context, 'update_media', { id })
    return ok(row)
  }, { outputSchema: recordOutput })

  server.tool('delete_media', 'Delete a media item and the stored objects only it owns. Media still referenced (a post cover, a product logo, the hero…) is refused with the list of references unless force is true, which clears them. dryRun: true lists the references and the objects that would be deleted or kept. A storage delete that fails is queued and retried; the result says whether cleanup is complete or pending.', {
    id: objectIdInput.describe('The _id of the media item'),
    force: z.boolean().optional().describe('Delete even if referenced, clearing the references'),
    dryRun: dryRunInput,
  }, async ({ id, force, dryRun }, context) => {
    if (dryRun) return ok(await previewMediaDelete(id))
    const result = await deleteMedia(id, { force: force === true })
    auditLog(context, 'delete_media', { id, force: force === true, storage: result.storage.status })
    return ok(result)
  }, { outputSchema: deletedOutput })

  server.tool('upload_image', 'Download an image from a URL and add it to the media library. The bytes must be a JPEG, PNG, GIF, WebP or AVIF (checked from the file itself, not the declared type; SVG is refused), at most 25 MiB and 40 megapixels. Identical bytes already in the same folder under the same name are reused instead of uploaded again (`reused: true`). `warnings` reports thumbnails that could not be generated.', {
    url: sourceUrlInput.describe('Source URL of the image to download'),
    filename: z.string().max(120).optional().describe('Desired filename; the extension is set from the detected type. Derived from the URL if omitted.'),
    folder: folderInput.optional().describe('Folder within the library, e.g. "newsroom". Defaults to "images".'),
    alt: z.string().max(500).optional().describe('Alt text for the image'),
    tags: z.array(z.string().max(60)).max(20).optional().describe('Tags for organization'),
  }, async (params, context) => {
    try {
      const { buffer } = await downloadRemote(params.url, { signal: context.signal })
      const result = await ingestImage({
        buffer,
        filename: params.filename ?? filenameFromUrl(params.url),
        folder: params.folder ?? 'images',
        alt: params.alt,
        tags: params.tags,
        uploadedBy: context.actorId,
      })
      auditLog(context, 'upload_image', { mediaId: result.media._id, reused: result.reused })
      return ok({ ...mediaSummary(result.media), reused: result.reused, warnings: result.warnings })
    } catch (e) { return toolError(e) }
  })

  server.tool('upload_and_set_post_cover', 'Download an image, add it to the media library and set it as a newsroom post\'s coverImage, in one step. The post is checked before anything is downloaded; the media row and the post update commit together, and if the post disappears meanwhile nothing is left behind.', {
    postSlug: z.string().min(1).describe('Slug of the post to update'),
    imageUrl: sourceUrlInput.describe('Source URL of the image to download'),
    filename: z.string().max(120).optional().describe('Desired filename. Derived from the URL if omitted.'),
    alt: z.string().max(500).optional().describe('Alt text for the image'),
  }, async (params, context) => {
    try {
      const [target] = await db.select({ id: newsroomPosts._id }).from(newsroomPosts).where(eq(newsroomPosts.slug, params.postSlug)).limit(1)
      if (!target) throw notFound('Post', { slug: params.postSlug })

      const { buffer } = await downloadRemote(params.imageUrl, { signal: context.signal })
      const result = await ingestImage(
        { buffer, filename: params.filename ?? filenameFromUrl(params.imageUrl) ?? 'cover', folder: 'newsroom', alt: params.alt, tags: ['newsroom'], uploadedBy: context.actorId },
        async (tx, mediaRow) => {
          const [row] = await tx
            .update(newsroomPosts)
            .set({ coverImage: mediaRow._id, imageAlt: params.alt || '', updatedAt: new Date() })
            .where(eq(newsroomPosts._id, target.id))
            .returning()
          if (!row) throw notFound('Post', { slug: params.postSlug })
          return row
        },
      )
      auditLog(context, 'upload_and_set_post_cover', { postId: target.id, mediaId: result.media._id, reused: result.reused })
      const post = await populateOne(result.attached, NEWSROOM_REFS)
      return ok({ media: result.media, post, reused: result.reused, warnings: result.warnings })
    } catch (e) { return toolError(e) }
  })

  server.tool('upload_and_set_team_avatar', 'Download an image, add it to the media library and set it as a team member\'s avatar, in one step. The member is checked before anything is downloaded; the media row and the member update commit together.', {
    memberSlug: z.string().min(1).describe('Slug of the team member to update'),
    imageUrl: sourceUrlInput.describe('Source URL of the image to download'),
    filename: z.string().max(120).optional(),
    alt: z.string().max(500).optional(),
  }, async (params, context) => {
    try {
      const [target] = await db.select({ id: teamMembers._id }).from(teamMembers).where(eq(teamMembers.slug, params.memberSlug)).limit(1)
      if (!target) throw notFound('Team member', { slug: params.memberSlug })

      const { buffer } = await downloadRemote(params.imageUrl, { signal: context.signal })
      const result = await ingestImage(
        { buffer, filename: params.filename ?? filenameFromUrl(params.imageUrl) ?? 'avatar', folder: 'team', alt: params.alt, tags: ['team'], uploadedBy: context.actorId },
        async (tx, mediaRow) => {
          const [row] = await tx
            .update(teamMembers)
            .set({ avatar: mediaRow._id, updatedAt: new Date() })
            .where(eq(teamMembers._id, target.id))
            .returning()
          if (!row) throw notFound('Team member', { slug: params.memberSlug })
          return row
        },
      )
      auditLog(context, 'upload_and_set_team_avatar', { memberId: target.id, mediaId: result.media._id, reused: result.reused })
      const member = await populateOne(result.attached, { avatar: media })
      return ok({ media: result.media, member, reused: result.reused, warnings: result.warnings })
    } catch (e) { return toolError(e) }
  })

  type BulkItemStatus = 'ok' | 'unchanged' | 'error' | 'skipped'

  interface BulkItemResult {
    slug: string
    status: BulkItemStatus
    mediaId?: string
    reused?: boolean
    warnings?: string[]
    error?: { code: string; message: string }
  }

  server.tool('bulk_upload_post_covers', `Set cover images for up to ${MAX_BULK_ITEMS} newsroom posts in one call, one post at a time. Every item gets its own status: "ok" (cover set), "unchanged" (the post already had exactly this image), "error" (with a code and message) or "skipped" (not started: the call ran out of time or was cancelled). Re-running the same list is safe: finished items come back "unchanged" and are not uploaded again.`, {
    posts: z.array(z.object({
      slug: z.string().min(1).describe('Post slug'),
      imageUrl: sourceUrlInput.describe('Source URL of the cover image'),
      alt: z.string().max(500).optional().describe('Alt text'),
    })).min(1).max(MAX_BULK_ITEMS).describe('Posts with their cover image URLs'),
  }, async ({ posts }, context) => {
    try {
      const slugs = posts.map((p) => p.slug)
      if (new Set(slugs).size !== slugs.length) throw invalid('Each post slug may appear only once')

      const found = await db
        .select({ id: newsroomPosts._id, slug: newsroomPosts.slug, coverImage: newsroomPosts.coverImage })
        .from(newsroomPosts)
        .where(or(...slugs.map((slug) => eq(newsroomPosts.slug, slug))))
      const bySlug = new Map(found.map((row) => [row.slug, row]))
      const startedAt = Date.now()

      const results: BulkItemResult[] = []
      for (const item of posts) {
        if (context.signal?.aborted || Date.now() - startedAt > BULK_TIME_BUDGET_MS) {
          results.push({ slug: item.slug, status: 'skipped' })
          continue
        }
        const target = bySlug.get(item.slug)
        if (!target) {
          results.push({ slug: item.slug, status: 'error', error: { code: 'not_found', message: 'Post not found' } })
          continue
        }
        try {
          const { buffer } = await downloadRemote(item.imageUrl, { signal: context.signal })
          const result = await ingestImage(
            { buffer, filename: filenameFromUrl(item.imageUrl) ?? 'cover', folder: 'newsroom', alt: item.alt, tags: ['newsroom'], uploadedBy: context.actorId },
            async (tx, mediaRow) => {
              const [row] = await tx
                .update(newsroomPosts)
                .set({ coverImage: mediaRow._id, imageAlt: item.alt || '', updatedAt: new Date() })
                .where(eq(newsroomPosts._id, target.id))
                .returning({ id: newsroomPosts._id })
              if (!row) throw notFound('Post', { slug: item.slug })
              return row
            },
          )
          const unchanged = result.reused && target.coverImage === result.media._id
          results.push({ slug: item.slug, status: unchanged ? 'unchanged' : 'ok', mediaId: result.media._id, reused: result.reused, warnings: result.warnings })
        } catch (e) {
          const { error } = toolError(e).structuredContent as { error: { code: string; message: string } }
          results.push({ slug: item.slug, status: 'error', error: { code: error.code, message: error.message } })
        }
      }

      const summary = Object.fromEntries((['ok', 'unchanged', 'error', 'skipped'] as const).map((status) => [status, results.filter((r) => r.status === status).length]))
      auditLog(context, 'bulk_upload_post_covers', summary)
      const complete = summary.error === 0 && summary.skipped === 0
      return ok({ complete, summary, results })
    } catch (e) { return toolError(e) }
  })

  server.tool('debug_upload_test', 'Maintenance only (enabled with MCP_ENABLE_DIAGNOSTICS). Downloads a URL, stores it under a diagnostics prefix, writes and removes a media row, and deletes the stored object again, reporting which step failed.', {
    url: sourceUrlInput.describe('URL to test downloading'),
  }, async ({ url }, context) => {
    const steps: { step: string; ok: boolean }[] = []
    let storedKey: string | null = null
    let mediaId: string | null = null
    try {
      const { buffer } = await downloadRemote(url, { signal: context.signal })
      steps.push({ step: `download (${buffer.length} bytes)`, ok: true })
      const cdnUrl = await uploadToSpaces(buffer, 'debug-test.bin', 'application/octet-stream', 'oxy-website/debug')
      storedKey = keyFromPublicUrl(cdnUrl)
      steps.push({ step: 'storage upload', ok: true })
      const [row] = await db.insert(media).values({
        url: cdnUrl, thumbnails: { sm: '', md: '', lg: '' },
        filename: 'debug-test.bin', key: storedKey ?? '',
        mimeType: 'application/octet-stream', size: buffer.length,
        alt: '', tags: ['debug'], folder: 'debug', uploadedBy: context.actorId,
      }).returning({ id: media._id })
      mediaId = row.id
      steps.push({ step: 'media insert', ok: true })
      return ok({ success: true, steps })
    } catch (e) {
      const failure = toolError(e)
      steps.push({ step: 'failed', ok: false })
      return { ...failure, structuredContent: { ...failure.structuredContent, steps } }
    } finally {
      // Cleanup runs whatever happened above, and its own failure is logged, not
      // swallowed into a success.
      if (mediaId) await db.delete(media).where(eq(media._id, mediaId)).catch((e) => console.error('[mcp] debug_upload_test: media cleanup failed', e))
      if (storedKey) await deleteFromSpaces(storedKey).catch((e) => console.error('[mcp] debug_upload_test: storage cleanup failed', e))
    }
  })
}
