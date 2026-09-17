import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db, runInUnitOfWork } from '../../db/postgres.js'
import { populate, populateOne } from '../../db/refs.js'
import { newsroomPosts, products, translations } from '../../db/schema/index.js'
import { isNewsroomThemePreset, newsroomThemeForSlug } from '../../constants/newsroomThemes.js'
import { attachProducts, attachSummaryCoverImages, NEWSROOM_REFS, NEWSROOM_SUMMARY_COLUMNS, toNewsroomSummary } from '../../services/newsroom.js'
import { insertWithSlug, slugBase } from '../../services/slugs.js'
import { overlayMany, overlayOne } from '../localized.js'
import type { ToolContext, ToolRegistrar } from '../registry.js'
import { invalid, notFound, ok } from '../results.js'
import {
  dateInput, deletedOutput, dryRunInput, expectedUpdatedAtInput, limitInput, markdownBody, objectIdInput, pagedOutput, pageInput,
  pageOf, readLocaleInput, recordOutput, slugInput, slugLookup, tagList, text, title,
} from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* Newsroom posts. A listing carries summaries (no article bodies) unless
   `view: "full"` is asked for, for admins and readers alike. */

const STATUS = z.enum(['draft', 'published'])
const mediaRef = z.union([z.literal(''), objectIdInput])

const postFields = {
  resume: text(1000).optional().describe('Short summary for cards/listings (1-2 sentences)'),
  description: text(5000).optional().describe('Longer description of the post'),
  content: markdownBody.optional().describe('Full post body in Markdown'),
  coverImage: mediaRef.optional().describe('Media _id for the cover image; empty string clears it'),
  imageAlt: text(500).optional().describe('Alt text for the cover image'),
  tags: tagList.optional().describe('Tags, e.g. ["ai", "product-update"]'),
  categories: z.array(text(60).min(1)).max(10).optional().describe('Categories. Common: Company, Research, Product, Safety, Engineering, Security'),
  products: z.array(text(80).min(1)).max(20).optional().describe('productIds of the products this post is about (e.g. ["mention", "alia"]); replaces the list'),
  featured: z.boolean().optional().describe('Whether this post appears in the featured section'),
  colorPrimary: text(60).optional().describe('Primary theme colour (hex or CSS colour)'),
  colorSecondary: text(60).optional().describe('Secondary theme colour (hex or CSS colour)'),
  themePreset: z.string().refine(isNewsroomThemePreset, 'Must be a Bloom newsroom recipe').optional(),
  dark: z.boolean().optional().describe('Whether the post uses dark styling'),
  oxyUserId: text(64).min(1).optional().describe('Oxy user id of the editorial author. Defaults to the acting account on create.'),
  metaTitle: text(300).optional().describe('SEO title override'),
  ogImage: mediaRef.optional().describe('Media _id for the Open Graph image; empty string clears it'),
  publishedAt: dateInput.optional().describe('Publication date, e.g. "2026-03-20"'),
}

/** productIds → row ids, refusing any that do not exist rather than dropping them. */
async function productIdsToRefs(productIds: string[] | undefined): Promise<string[] | undefined> {
  if (productIds === undefined) return undefined
  if (productIds.length === 0) return []
  const rows = await db.select({ id: products._id, productId: products.productId }).from(products).where(inArray(products.productId, productIds))
  const byProductId = new Map(rows.map((row) => [row.productId, row.id]))
  const missing = productIds.filter((id) => !byProductId.has(id))
  if (missing.length > 0) throw invalid('Unknown productIds', { missing })
  return productIds.map((id) => byProductId.get(id) as string)
}

function normalizePost<T extends Record<string, unknown>>(fields: T): T {
  const next: Record<string, unknown> = { ...fields }
  if (fields.coverImage !== undefined) next.coverImage = fields.coverImage || null
  if (fields.ogImage !== undefined) next.ogImage = fields.ogImage || null
  if (typeof fields.publishedAt === 'string') next.publishedAt = new Date(fields.publishedAt)
  return next as T
}

async function presentPost(row: Record<string, unknown>, locale?: string): Promise<Record<string, unknown>> {
  const post = await populateOne(row, NEWSROOM_REFS)
  const [withProducts] = await attachProducts([post as Record<string, unknown>])
  return overlayOne('newsroom', withProducts, locale)
}

interface ListInput {
  category?: string
  tag?: string
  featured?: boolean
  status?: 'draft' | 'published'
  search?: string
  product?: string
  author?: string
  view?: 'summary' | 'full'
  locale?: string
  page?: number
  limit?: number
}

async function listPosts(input: ListInput) {
  const filters: SQL[] = []
  if (input.category) filters.push(sql`${newsroomPosts.categories} @> ARRAY[${input.category}]::text[]`)
  if (input.tag) filters.push(sql`${newsroomPosts.tags} @> ARRAY[${input.tag}]::text[]`)
  if (input.featured !== undefined) filters.push(eq(newsroomPosts.featured, input.featured))
  if (input.status) filters.push(eq(newsroomPosts.status, input.status))
  if (input.author) filters.push(eq(newsroomPosts.oxyUserId, input.author))
  if (input.search) {
    const pattern = `%${input.search}%`
    filters.push(or(ilike(newsroomPosts.title, pattern), ilike(newsroomPosts.resume, pattern)) as SQL)
  }
  const { page, limit, offset } = pageOf(input)
  if (input.product) {
    const [product] = await db.select({ id: products._id }).from(products).where(eq(products.productId, input.product)).limit(1)
    if (!product) return { posts: [], total: 0, page, pages: 0 }
    filters.push(sql`${newsroomPosts.products} @> ARRAY[${product.id}]::text[]`)
  }
  const where = filters.length > 0 ? and(...filters) : undefined
  const order = [desc(newsroomPosts.publishedAt), asc(newsroomPosts._id)] as const
  const full = input.view === 'full'

  const [rows, [totals]] = await Promise.all([
    full
      ? db.select().from(newsroomPosts).where(where).orderBy(...order).offset(offset).limit(limit)
      : db.select({ ...NEWSROOM_SUMMARY_COLUMNS, status: newsroomPosts.status, updatedAt: newsroomPosts.updatedAt }).from(newsroomPosts).where(where).orderBy(...order).offset(offset).limit(limit),
    db.select({ value: count() }).from(newsroomPosts).where(where),
  ])
  const total = Number(totals?.value ?? 0)
  let posts = rows as Record<string, unknown>[]
  if (full) {
    await populate(posts, NEWSROOM_REFS)
    await attachProducts(posts)
  } else {
    await attachSummaryCoverImages(posts)
  }
  posts = await overlayMany('newsroom', posts, input.locale)
  // A translation holds the whole editorial document; project again so a
  // localized summary cannot bring the body back in.
  if (!full) posts = posts.map((post) => ({ ...toNewsroomSummary(post), status: post.status, updatedAt: post.updatedAt }))
  return { posts, total, page, pages: Math.ceil(total / limit) }
}

const listShape = {
  category: text(60).optional().describe('Posts in this category (e.g. "Research")'),
  tag: text(60).optional().describe('Posts with this tag'),
  featured: z.boolean().optional().describe('true: only featured posts. false: only posts that are not featured (admins only). Omit for both.'),
  status: STATUS.optional().describe('Admins only. Omit for every status; readers always get published posts.'),
  product: text(80).optional().describe('Posts about this product, by productId (e.g. "mention")'),
  author: text(64).optional().describe('Posts by this Oxy user id'),
  view: z.enum(['summary', 'full']).optional().describe('"summary" (default): card fields without the body. "full": complete posts.'),
  locale: readLocaleInput,
  page: pageInput,
  limit: limitInput,
}

export function registerNewsroomTools(server: ToolRegistrar): void {
  server.tool('list_posts', 'List newsroom posts, newest first, with filters and pagination. Returns { posts, total, page, pages }; posts are summaries unless view is "full".', {
    ...listShape,
    search: text(200).optional().describe('Match against title and summary'),
  }, async (input) => ok(await listPosts(input)), { outputSchema: pagedOutput('posts'), localized: true })

  server.tool('search_posts', 'Search newsroom posts by title or summary text. Same result shape and filters as list_posts.', {
    query: text(200).min(1).describe('Text to match against titles and summaries'),
    view: listShape.view,
    locale: readLocaleInput,
    page: pageInput,
    limit: limitInput,
  }, async ({ query, ...rest }) => ok(await listPosts({ ...rest, search: query })), { outputSchema: pagedOutput('posts'), localized: true })

  const getPost = async ({ slug, locale }: { slug: string; locale?: string }) => {
    const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, slug)).limit(1)
    if (!row) throw notFound('Post')
    return ok(await presentPost(row, locale))
  }
  server.tool('get_post', 'Get one newsroom post by slug: full content, cover and OG images resolved, products expanded. Readers only see published posts.', {
    slug: slugLookup.describe('The URL slug of the post'),
    locale: readLocaleInput,
  }, getPost, { outputSchema: recordOutput, localized: true })
  server.tool('get_post_with_media', 'Deprecated alias of get_post, kept for existing clients; use get_post.', {
    slug: slugLookup.describe('The URL slug of the post'),
    locale: readLocaleInput,
  }, getPost, { outputSchema: recordOutput, localized: true })

  server.tool('create_post', 'Create a newsroom post. It is published immediately unless status is "draft" — send status deliberately. If slug is omitted it is generated from the title (a numeric suffix is added if taken); an explicit slug that is taken is refused. `oxyUserId` sets the editorial author and defaults to the acting account, which is also who the change is attributed to.', {
    title: title.describe('Post headline'),
    slug: slugInput.optional().describe('URL slug. Generated from the title if omitted.'),
    status: STATUS.optional().describe('"published" (default) or "draft"'),
    ...postFields,
  }, async (params, context: ToolContext) => {
    const productRefs = await productIdsToRefs(params.products)
    const post = await insertWithSlug({ explicit: params.slug, base: slugBase(params.title, 'post') }, async (slug) => {
      const [row] = await db
        .insert(newsroomPosts)
        .values(normalizePost({
          ...params,
          slug,
          products: productRefs ?? [],
          themePreset: isNewsroomThemePreset(params.themePreset) ? params.themePreset : newsroomThemeForSlug(slug),
          publishedAt: params.publishedAt ?? new Date().toISOString(),
          oxyUserId: params.oxyUserId || context.actorId,
          coverImage: params.coverImage ?? '',
          ogImage: params.ogImage ?? '',
        }) as never)
        .returning()
      return row
    })
    auditLog(context, 'create_post', { id: post._id, slug: post.slug, status: post.status })
    return ok(await presentPost(post))
  }, { outputSchema: recordOutput })

  server.tool('update_post', 'Update a newsroom post by slug. Only the fields you pass change. Pass expectedUpdatedAt (from get_post) to refuse the write if someone changed the post since.', {
    slug: slugLookup.describe('Current slug of the post'),
    newSlug: slugInput.optional().describe('New slug; must be unused'),
    title: title.optional(),
    status: STATUS.optional(),
    ...postFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, newSlug, expectedUpdatedAt, products: productIds, ...fields }, context) => {
    const patch: Record<string, unknown> = normalizePost({ ...fields })
    if (newSlug) patch.slug = newSlug
    const productRefs = await productIdsToRefs(productIds)
    if (productRefs) patch.products = productRefs
    const row = await updateRecord({ table: newsroomPosts, where: eq(newsroomPosts.slug, slug), label: 'Post', patch, expectedUpdatedAt })
    auditLog(context, 'update_post', { id: row._id, slug: row.slug, fields: Object.keys(patch) })
    return ok(await presentPost(row))
  }, { outputSchema: recordOutput })

  server.tool('delete_post', 'Permanently delete a newsroom post and its translations. dryRun: true reports the post and how many translations would go, without deleting.', {
    slug: slugLookup.describe('The URL slug of the post'),
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ slug, dryRun, expectedUpdatedAt }, context) => {
    const translationsOf = (id: unknown) => and(eq(translations.collectionName, 'newsroom'), eq(translations.documentId, String(id)))
    // The post and its translations go together or not at all.
    const outcome = await runInUnitOfWork(async () => {
      const result = await deleteRecord({
        table: newsroomPosts,
        where: eq(newsroomPosts.slug, slug),
        label: 'Post',
        dryRun,
        expectedUpdatedAt,
        describe: (row) => ({ _id: row._id, slug: row.slug, title: row.title, status: row.status }),
        impact: async (row) => {
          const [n] = await db.select({ value: count() }).from(translations).where(translationsOf(row._id))
          return { translations: Number(n?.value ?? 0) }
        },
      })
      if (!result.deleted) return result
      const removed = await db.delete(translations).where(translationsOf(result.target._id)).returning({ id: translations._id })
      return { deleted: true as const, slug, post: result.target, translationsRemoved: removed.length }
    })
    if (outcome.deleted) auditLog(context, 'delete_post', { slug })
    return ok(outcome)
  }, { outputSchema: deletedOutput })
}
