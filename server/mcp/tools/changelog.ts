import { and, asc, count, desc, eq, ilike, isNotNull, or, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/postgres.js'
import { populate, populateOne } from '../../db/refs.js'
import { changelogEntries, media, trackedRepos } from '../../db/schema/index.js'
import { isUniqueViolation } from '../../db/pgErrors.js'
import { syncAllRepos, syncSingleRepo } from '../../services/githubSync.js'
import { overlayMany } from '../localized.js'
import type { ToolRegistrar } from '../registry.js'
import { conflict, invalid, notFound, ok } from '../results.js'
import {
  dateInput, deletedOutput, dryRunInput, expectedUpdatedAtInput, hexColorInput, itemsOutput, limitInput, markdownBody, objectIdInput,
  pagedOutput, pageInput, pageOf, readLocaleInput, recordOutput, tagList, text, title,
} from '../schemas.js'
import { auditLog, deleteRecord, updateRecord } from '../writes.js'

/* The changelog and the GitHub repos it is synced from. */

const mediaRef = z.union([z.literal(''), objectIdInput])
const githubName = z.string().min(1).max(100).regex(/^[A-Za-z0-9_.-]+$/, 'A GitHub owner or repository name')
const defaultTagsInput = z.array(z.object({ label: text(40).min(1), color: hexColorInput })).max(10)

const entryFields = {
  content: markdownBody.optional().describe('Entry body in Markdown'),
  tags: tagList.optional().describe('Tags like ["Feature", "Enhancement", "Fix", "Design"]'),
  items: z.array(text(500)).max(100).optional().describe('Bullet points'),
  media: mediaRef.optional().describe('Media _id for an image or video; empty string clears it'),
}

export function registerChangelogTools(server: ToolRegistrar): void {
  server.tool('list_changelog', 'List changelog entries, newest first. Returns { entries, total, page, pages, repos } where repos are the repositories that have entries. `search` is admin-only.', {
    repo: text(201).optional().describe('Filter by repo: "owner/name" or "name"'),
    search: text(200).optional().describe('Admins only: match title or content'),
    locale: readLocaleInput,
    page: pageInput,
    limit: limitInput,
  }, async (params) => {
    const { page, limit, offset } = pageOf(params)
    const filters: SQL[] = []
    if (params.repo) {
      const parts = params.repo.split('/')
      if (parts.length === 2) {
        filters.push(eq(changelogEntries.repoOwner, parts[0]), eq(changelogEntries.repoName, parts[1]))
      } else {
        filters.push(eq(changelogEntries.repoName, params.repo))
      }
    }
    if (params.search) {
      const pattern = `%${params.search}%`
      filters.push(or(ilike(changelogEntries.title, pattern), ilike(changelogEntries.content, pattern)) as SQL)
    }
    const where = filters.length > 0 ? and(...filters) : undefined
    const [rows, [totals], repos] = await Promise.all([
      db.select().from(changelogEntries).where(where).orderBy(desc(changelogEntries.date), asc(changelogEntries._id)).offset(offset).limit(limit),
      db.select({ value: count() }).from(changelogEntries).where(where),
      db
        .selectDistinct({ owner: changelogEntries.repoOwner, name: changelogEntries.repoName, displayName: changelogEntries.repoDisplayName })
        .from(changelogEntries)
        .where(isNotNull(changelogEntries.repoOwner))
        .orderBy(asc(changelogEntries.repoDisplayName)),
    ])
    const total = Number(totals?.value ?? 0)
    const entries = await overlayMany('changelog', await populate(rows, { media }), params.locale)
    return ok({ entries, total, page, pages: Math.ceil(total / limit), repos })
  }, { outputSchema: pagedOutput('entries'), localized: true })

  server.tool('create_changelog_entry', 'Create a manual changelog entry.', {
    title: title.describe('Entry headline'),
    date: dateInput.describe('Entry date, e.g. "2026-03-20"'),
    ...entryFields,
  }, async (params, context) => {
    const [entry] = await db.insert(changelogEntries).values({ ...params, media: params.media || null, date: new Date(params.date) } as never).returning()
    auditLog(context, 'create_changelog_entry', { id: entry._id })
    return ok(await populateOne(entry, { media }))
  }, { outputSchema: recordOutput })

  server.tool('update_changelog_entry', 'Update a changelog entry by _id. Only the fields you pass change.', {
    id: objectIdInput.describe('The _id of the changelog entry'),
    title: title.optional(),
    date: dateInput.optional(),
    ...entryFields,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ id, expectedUpdatedAt, ...fields }, context) => {
    const patch: Record<string, unknown> = { ...fields }
    if (fields.date) patch.date = new Date(fields.date)
    if (fields.media !== undefined) patch.media = fields.media || null
    const entry = await updateRecord({ table: changelogEntries, where: eq(changelogEntries._id, id), label: 'Changelog entry', patch, expectedUpdatedAt })
    auditLog(context, 'update_changelog_entry', { id })
    return ok(await populateOne(entry, { media }))
  }, { outputSchema: recordOutput })

  server.tool('delete_changelog_entry', 'Permanently delete a changelog entry by _id. dryRun: true shows the entry without deleting. An entry synced from a GitHub release comes back on the next sync while its repo is active.', {
    id: objectIdInput.describe('The _id of the entry'),
    dryRun: dryRunInput,
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ id, dryRun, expectedUpdatedAt }, context) => {
    const result = await deleteRecord({
      table: changelogEntries,
      where: eq(changelogEntries._id, id),
      label: 'Changelog entry',
      dryRun,
      expectedUpdatedAt,
      describe: (row) => ({ _id: row._id, title: row.title, date: row.date, synced: row.githubReleaseId != null }),
    })
    if (result.deleted) auditLog(context, 'delete_changelog_entry', { id })
    return ok(result.deleted ? { deleted: true, id, entry: result.target } : result)
  }, { outputSchema: deletedOutput })

  server.tool('list_tracked_repos', 'List the GitHub repos tracked for changelog sync and the feature board, with their sync state.', {}, async () => {
    return ok(await db.select().from(trackedRepos).orderBy(asc(trackedRepos.displayName), asc(trackedRepos._id)))
  }, { output: 'items', outputSchema: itemsOutput })

  server.tool('add_tracked_repo', 'Track a GitHub repo. Its releases sync as changelog entries while active; it joins the public feature board only with featureBoard: true.', {
    owner: githubName.describe('GitHub owner, e.g. "OxyHQ"'),
    repo: githubName.describe('Repository name, e.g. "Oxy"'),
    displayName: text(120).min(1).optional().describe('Name shown in the changelog and on the feature board. Defaults to "owner/repo".'),
    defaultTags: defaultTagsInput.optional().describe('Tags applied to synced entries'),
    active: z.boolean().optional().describe('Changelog release sync on. Defaults to true.'),
    featureBoard: z.boolean().optional().describe('List its feature requests on the public board. Defaults to false.'),
    acceptsProposals: z.boolean().optional().describe('Let signed-in visitors open feature requests here. Requires featureBoard. Defaults to false.'),
  }, async (params, context) => {
    if (params.acceptsProposals && !params.featureBoard) throw invalid('acceptsProposals requires featureBoard: true')
    try {
      const [tracked] = await db.insert(trackedRepos).values({
        ...params,
        displayName: params.displayName || `${params.owner}/${params.repo}`,
        defaultTags: params.defaultTags ?? [],
        active: params.active !== false,
        featureBoard: params.featureBoard === true,
        acceptsProposals: params.acceptsProposals === true,
      }).returning()
      auditLog(context, 'add_tracked_repo', { id: tracked._id, repo: `${tracked.owner}/${tracked.repo}` })
      return ok(tracked)
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict(`${params.owner}/${params.repo} is already tracked`)
      throw error
    }
  }, { outputSchema: recordOutput })

  server.tool('update_tracked_repo', 'Update a tracked repo: display name, default tags, sync switch, feature board and proposals. Turning the feature board off also turns proposals off.', {
    id: objectIdInput.describe('The _id of the tracked repo'),
    displayName: text(120).min(1).optional(),
    defaultTags: defaultTagsInput.optional(),
    active: z.boolean().optional().describe('Changelog release sync on'),
    featureBoard: z.boolean().optional().describe('Listed on the public feature board'),
    acceptsProposals: z.boolean().optional().describe('Accepts feature proposals from the website'),
    expectedUpdatedAt: expectedUpdatedAtInput,
  }, async ({ id, expectedUpdatedAt, ...fields }, context) => {
    const patch: Record<string, unknown> = { ...fields }
    if (fields.featureBoard === false) patch.acceptsProposals = false
    if (fields.acceptsProposals === true && fields.featureBoard === undefined) {
      const [current] = await db.select({ featureBoard: trackedRepos.featureBoard }).from(trackedRepos).where(eq(trackedRepos._id, id)).limit(1)
      if (current && !current.featureBoard) throw invalid('acceptsProposals requires the repo to be on the feature board')
    }
    const tracked = await updateRecord({ table: trackedRepos, where: eq(trackedRepos._id, id), label: 'Tracked repo', patch, expectedUpdatedAt })
    auditLog(context, 'update_tracked_repo', { id, fields: Object.keys(patch) })
    return ok(tracked)
  }, { outputSchema: recordOutput })

  server.tool('remove_tracked_repo', 'Stop tracking a repo. Its existing changelog entries stay. dryRun: true shows the repo and how many entries it has.', {
    id: objectIdInput.describe('The _id of the tracked repo'),
    dryRun: dryRunInput,
  }, async ({ id, dryRun }, context) => {
    const result = await deleteRecord({
      table: trackedRepos,
      where: eq(trackedRepos._id, id),
      label: 'Tracked repo',
      dryRun,
      describe: (row) => ({ _id: row._id, owner: row.owner, repo: row.repo, displayName: row.displayName }),
      impact: async (row) => {
        const [n] = await db.select({ value: count() }).from(changelogEntries).where(and(eq(changelogEntries.repoOwner, String(row.owner)), eq(changelogEntries.repoName, String(row.repo))))
        return { changelogEntriesKept: Number(n?.value ?? 0), featureBoardListing: row.featureBoard === true }
      },
    })
    if (result.deleted) auditLog(context, 'remove_tracked_repo', { id })
    return ok(result.deleted ? { deleted: true, id, repo: result.target } : result)
  }, { outputSchema: deletedOutput })

  server.tool('sync_repo', 'Fetch new GitHub releases for one active tracked repo now and add them as changelog entries. Returns how many were added.', {
    id: objectIdInput.describe('The _id of the tracked repo'),
  }, async ({ id }, context) => {
    const [repo] = await db.select({ active: trackedRepos.active }).from(trackedRepos).where(eq(trackedRepos._id, id)).limit(1)
    if (!repo) throw notFound('Tracked repo')
    if (!repo.active) throw invalid('This repo\'s changelog sync is turned off; set active: true first')
    const synced = await syncSingleRepo(id)
    auditLog(context, 'sync_repo', { id, synced })
    return ok({ synced })
  })

  server.tool('sync_all_repos', 'Fetch new GitHub releases for every active tracked repo now. Waits for the sync to finish.', {}, async (_input, context) => {
    await syncAllRepos()
    auditLog(context, 'sync_all_repos', {})
    return ok({ ok: true, message: 'Sync complete' })
  })
}
