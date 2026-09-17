import { beforeEach, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { courses, helpArticles, heroContents, jobs, locales, media, newsroomPosts, pricingPlans, resources, storageCleanups, teamMembers, testimonials, translations } from '../db/schema/index.js'
import { invokeTool, WEBSITE_MCP_CATALOG } from '../mcp.js'
import { MCP_TOOL_ACCESS, MCP_WRITE_EFFECTS } from '../mcpAccess.js'
import { admin, countRows, data, errorCode, omit, png, remote, resetDatabase, storage } from '../test/helpers.js'
import { retryStorageCleanups } from '../services/media.js'

/* Issue #108, phase A: every scenario here failed, or could not be observed, on
   the code this replaced. */

beforeEach(resetDatabase)

async function seedPost(slug = 'launch', extra: Record<string, unknown> = {}) {
  const [row] = await db.insert(newsroomPosts).values({ title: 'Launch', slug, ...extra }).returning()
  return row
}

describe('F01 · creates hand back the row they wrote', () => {
  const cases = [
    { tool: 'create_course', table: 'courses', input: { title: 'Intro to Oxy' } },
    { tool: 'create_resource', table: 'resources', input: { title: 'Brand kit', href: '/brand' } },
    { tool: 'create_help_article', table: 'help_articles', input: { title: 'Reset your password' } },
  ] as const

  for (const { tool, table, input } of cases) {
    test(`${tool} returns the document with _id and slug, and writes exactly one row`, async () => {
      const created = data<{ _id: string; slug: string; title: string }>(await invokeTool(tool, { ...input }, admin))
      expect(created._id).toMatch(/^[0-9a-f]{24}$/)
      expect(created.slug).toBe(input.title.toLowerCase().replace(/ /g, '-'))
      expect(await countRows(table)).toBe(1)

      const read = data<{ _id: string }>(await invokeTool(tool.replace('create_', 'get_'), { slug: created.slug }, admin))
      expect(read._id).toBe(created._id)
    })

    test(`${tool} with invalid input writes nothing`, async () => {
      const result = await invokeTool(tool, { ...input, title: 42 }, admin)
      expect(errorCode(result)).toBe('invalid_request')
      expect(await countRows(table)).toBe(0)
    })
  }

  test('a retried create with the same explicit slug is refused, not duplicated', async () => {
    data(await invokeTool('create_course', { title: 'Intro', slug: 'intro' }, admin))
    const retry = await invokeTool('create_course', { title: 'Intro', slug: 'intro' }, admin)
    expect(errorCode(retry)).toBe('conflict')
    expect(await countRows('courses')).toBe(1)
  })
})

describe('F02 · slugs are generated, unique, and an explicit one is never rewritten', () => {
  test('create_job and create_team_member work without a slug', async () => {
    const job = data<{ slug: string }>(await invokeTool('create_job', { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote' }, admin))
    expect(job.slug).toBe('senior-frontend-engineer-remote')
    const member = data<{ slug: string }>(await invokeTool('create_team_member', { name: 'Núria Ålvarez-Øre', role: 'Design' }, admin))
    expect(member.slug).toBe('nuria-alvarez-ore')
  })

  test('a name with no Latin characters still gets a usable slug', async () => {
    const member = data<{ slug: string }>(await invokeTool('create_team_member', { name: '山田太郎', role: 'Research' }, admin))
    expect(member.slug).toMatch(/^member-[0-9a-f]{8}$/)
  })

  test('a generated slug that is taken gets a numeric suffix', async () => {
    const first = data<{ slug: string }>(await invokeTool('create_team_member', { name: 'Ada', role: 'Eng' }, admin))
    const second = data<{ slug: string }>(await invokeTool('create_team_member', { name: 'Ada', role: 'Eng' }, admin))
    expect([first.slug, second.slug]).toEqual(['ada', 'ada-2'])
  })

  test('an explicit duplicate slug is a conflict and writes nothing', async () => {
    data(await invokeTool('create_job', { title: 'A', department: 'X', slug: 'role' }, admin))
    const duplicate = await invokeTool('create_job', { title: 'B', department: 'X', slug: 'role' }, admin)
    expect(errorCode(duplicate)).toBe('conflict')
    expect(await countRows('jobs')).toBe(1)
    const [row] = await db.select().from(jobs)
    expect(row.title).toBe('A')
  })

  test('concurrent creates of the same title each get their own slug', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => invokeTool('create_post', { title: 'Same title', coverImage: '' }, admin)))
    const slugs = results.map((result) => data<{ slug: string }>(result).slug)
    expect(new Set(slugs).size).toBe(6)
    expect(await countRows('newsroom_posts')).toBe(6)
  })

  test('a locale created without a slug gets its code in lower case', async () => {
    const locale = data<{ slug: string }>(await invokeTool('create_locale', { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português' }, admin))
    expect(locale.slug).toBe('pt-br')
  })
})

describe('F03 · exactly one default locale survives every failure', () => {
  beforeEach(async () => {
    await db.insert(locales).values([
      { code: 'en', name: 'English', nativeName: 'English', isDefault: true, slug: 'en' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', slug: 'es' },
    ])
  })

  async function defaults() {
    return (await db.select().from(locales).where(eq(locales.isDefault, true))).map((row) => row.code)
  }

  test('update_locale of an unknown code returns not_found and changes nothing', async () => {
    const result = await invokeTool('update_locale', { code: 'fr', isDefault: true }, admin)
    expect(errorCode(result)).toBe('not_found')
    expect(await defaults()).toEqual(['en'])
  })

  test('a duplicate create with isDefault leaves the default where it was', async () => {
    const result = await invokeTool('create_locale', { code: 'es', name: 'Spanish', nativeName: 'Español', isDefault: true }, admin)
    expect(errorCode(result)).toBe('conflict')
    expect(await defaults()).toEqual(['en'])
  })

  test('moving the default is atomic', async () => {
    data(await invokeTool('update_locale', { code: 'es', isDefault: true }, admin))
    expect(await defaults()).toEqual(['es'])
  })

  test('the default cannot be unset, disabled or deleted directly', async () => {
    expect(errorCode(await invokeTool('update_locale', { code: 'en', isDefault: false }, admin))).toBe('invalid_request')
    expect(errorCode(await invokeTool('update_locale', { code: 'en', enabled: false }, admin))).toBe('invalid_request')
    expect(errorCode(await invokeTool('delete_locale', { code: 'en' }, admin))).toBe('invalid_request')
    expect(await defaults()).toEqual(['en'])
  })

  test('concurrent default changes and deletes keep exactly one default', async () => {
    await db.insert(locales).values([
      { code: 'fr', name: 'French', nativeName: 'Français', slug: 'fr' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', slug: 'de' },
    ])
    await Promise.all([
      invokeTool('update_locale', { code: 'es', isDefault: true }, admin),
      invokeTool('update_locale', { code: 'fr', isDefault: true }, admin),
      invokeTool('delete_locale', { code: 'es' }, admin),
      invokeTool('update_locale', { code: 'de', isDefault: true }, admin),
      invokeTool('delete_locale', { code: 'fr' }, admin),
    ])
    const remaining = await defaults()
    expect(remaining).toHaveLength(1)
    const [row] = await db.select().from(locales).where(eq(locales.code, remaining[0]))
    expect(row.enabled).toBe(true)
  })

  test('deleting a locale removes its translations in the same step', async () => {
    await db.insert(translations).values({ locale: 'es', collectionName: 'pages', documentId: 'x', fields: { title: 'Hola' } })
    const result = data<{ translationsRemoved: number }>(await invokeTool('delete_locale', { code: 'es' }, admin))
    expect(result.translationsRemoved).toBe(1)
    expect(await countRows('translations')).toBe(0)
  })
})

describe('F04 · pricing keeps what the caller did not touch', () => {
  async function seedPlans() {
    return db.insert(pricingPlans).values([
      { name: 'Free', price: { monthly: 0, annual: 0 }, cta: 'Start', ctaHref: '/signup', order: 0 },
      { name: 'Pro', price: { monthly: 20, annual: 200 }, cta: 'Buy', ctaHref: 'https://pay.oxy.so/pro', order: 1 },
    ]).returning()
  }

  test('read → edit one description → replace keeps every link, id and field', async () => {
    const seeded = await seedPlans()
    await db.insert(translations).values({ locale: 'es', collectionName: 'pricing', documentId: seeded[1]._id, fields: { name: 'Pro ES' } })
    const plans = data<Record<string, unknown>[]>(await invokeTool('get_pricing', {}, admin))
    const edited = plans.map((row) => omit(row, 'createdAt', 'updatedAt')).map((plan) => (plan.name === 'Pro' ? { ...plan, description: 'For teams' } : plan))
    const result = data<{ plans: { _id: string; ctaHref: string; description: string; name: string }[] }>(await invokeTool('replace_pricing', { plans: edited }, admin))
    expect(result.plans.map((plan) => plan.ctaHref)).toEqual(['/signup', 'https://pay.oxy.so/pro'])
    expect(result.plans.map((plan) => plan._id).sort()).toEqual(seeded.map((plan) => plan._id).sort())
    expect(result.plans.find((plan) => plan.name === 'Pro')?.description).toBe('For teams')
  })

  test('update_pricing_plan changes one field and nothing else', async () => {
    const [free] = await seedPlans()
    const updated = data<{ ctaHref: string; description: string; cta: string }>(await invokeTool('update_pricing_plan', { id: free._id, description: 'No card needed' }, admin))
    expect(updated).toMatchObject({ ctaHref: '/signup', description: 'No card needed', cta: 'Start' })
  })

  test('an empty replacement needs explicit confirmation', async () => {
    await seedPlans()
    expect(errorCode(await invokeTool('replace_pricing', { plans: [] }, admin))).toBe('invalid_request')
    expect(await countRows('pricing_plans')).toBe(2)
    data(await invokeTool('replace_pricing', { plans: [], confirmEmpty: true }, admin))
    expect(await countRows('pricing_plans')).toBe(0)
  })

  test('an unsafe ctaHref is refused', async () => {
    const result = await invokeTool('replace_pricing', { plans: [{ name: 'X', price: { monthly: 1, annual: 1 }, ctaHref: 'javascript:alert(1)' }] }, admin)
    expect(errorCode(result)).toBe('invalid_request')
  })

  test('testimonials keep their _id and refuse an unconfirmed empty list', async () => {
    const [row] = await db.insert(testimonials).values({ quote: 'Great', author: 'Ana' }).returning()
    const replaced = data<{ testimonials: { _id: string }[] }>(await invokeTool('replace_testimonials', { testimonials: [{ _id: row._id, quote: 'Great!', author: 'Ana' }] }, admin))
    expect(replaced.testimonials[0]._id).toBe(row._id)
    expect(errorCode(await invokeTool('replace_testimonials', { testimonials: [] }, admin))).toBe('invalid_request')
  })
})

describe('F05 · composite uploads succeed completely or leave nothing', () => {
  test('a missing post is refused before anything is downloaded or stored', async () => {
    remote.files.set('https://img.test/a.png', await png())
    const result = await invokeTool('upload_and_set_post_cover', { postSlug: 'nope', imageUrl: 'https://img.test/a.png' }, admin)
    expect(errorCode(result)).toBe('not_found')
    expect(remote.requested).toEqual([])
    expect(storage.objects.size).toBe(0)
    expect(await countRows('media')).toBe(0)
  })

  test('a missing team member is refused the same way', async () => {
    remote.files.set('https://img.test/a.png', await png())
    const result = await invokeTool('upload_and_set_team_avatar', { memberSlug: 'nobody', imageUrl: 'https://img.test/a.png' }, admin)
    expect(errorCode(result)).toBe('not_found')
    expect(storage.objects.size).toBe(0)
  })

  test('the cover is set, and the media row records the acting account', async () => {
    const post = await seedPost()
    remote.files.set('https://img.test/cover.png', await png(900, 500))
    const result = data<{ post: { coverImage: { _id: string } }; media: { _id: string; uploadedBy: string; mimeType: string } }>(
      await invokeTool('upload_and_set_post_cover', { postSlug: post.slug, imageUrl: 'https://img.test/cover.png', alt: 'Cover' }, admin),
    )
    expect(result.post.coverImage._id).toBe(result.media._id)
    expect(result.media.uploadedBy).toBe('admin-account')
    expect(result.media.mimeType).toBe('image/png')
    expect(storage.objects.size).toBeGreaterThan(1) // original + thumbnails
  })

  test('a post deleted between the check and the save leaves no row and no object', async () => {
    const post = await seedPost()
    remote.files.set('https://img.test/race.png', await png(300, 300, 3))
    // The post exists when the tool checks it, and is gone by the time the
    // download finishes and the media row would be attached.
    remote.onDownload = async () => {
      await db.delete(newsroomPosts).where(eq(newsroomPosts._id, post._id))
    }
    const result = await invokeTool('upload_and_set_post_cover', { postSlug: post.slug, imageUrl: 'https://img.test/race.png' }, admin)
    expect(errorCode(result)).toBe('not_found')
    expect(remote.requested).toEqual(['https://img.test/race.png'])
    expect(await countRows('media')).toBe(0)
    expect(storage.objects.size).toBe(0)
    expect(await countRows('storage_cleanups')).toBe(0)
  })

  test('the attach step failing inside the transaction rolls back the row and compensates the objects', async () => {
    const post = await seedPost()
    remote.files.set('https://img.test/x.png', await png(500, 500, 9))
    const { ingestImage } = await import('../services/media.js')
    const failure = ingestImage({ buffer: remote.files.get('https://img.test/x.png')!, filename: 'x.png', folder: 'newsroom', uploadedBy: 'admin-account' }, async () => {
      await db.delete(newsroomPosts).where(eq(newsroomPosts._id, post._id))
      throw new Error('target vanished')
    })
    await expect(failure).rejects.toThrow('target vanished')
    expect(await countRows('media')).toBe(0)
    expect(storage.objects.size).toBe(0)
  })

  test('a failed storage upload leaves no media row', async () => {
    const post = await seedPost()
    remote.files.set('https://img.test/y.png', await png())
    storage.failPuts = 1
    const result = await invokeTool('upload_and_set_post_cover', { postSlug: post.slug, imageUrl: 'https://img.test/y.png' }, admin)
    expect(result.isError).toBe(true)
    expect(await countRows('media')).toBe(0)
    const [row] = await db.select().from(newsroomPosts)
    expect(row.coverImage).toBeNull()
  })

  test('a mixed batch reports each item, and re-running it does not upload twice', async () => {
    await seedPost('one')
    await seedPost('two')
    remote.files.set('https://img.test/1.png', await png(64, 64, 1))
    remote.files.set('https://img.test/2.png', await png(64, 64, 2))
    const items = [
      { slug: 'one', imageUrl: 'https://img.test/1.png' },
      { slug: 'missing', imageUrl: 'https://img.test/1.png' },
      { slug: 'two', imageUrl: 'https://img.test/404.png' },
    ]
    const first = data<{ complete: boolean; summary: Record<string, number>; results: { slug: string; status: string; error?: { code: string } }[] }>(
      await invokeTool('bulk_upload_post_covers', { posts: items }, admin),
    )
    expect(first.complete).toBe(false)
    expect(first.results.map((r) => [r.slug, r.status])).toEqual([['one', 'ok'], ['missing', 'error'], ['two', 'error']])
    expect(first.results[1].error?.code).toBe('not_found')
    expect(first.summary).toEqual({ ok: 1, unchanged: 0, error: 2, skipped: 0 })

    const mediaAfterFirst = await countRows('media')
    const fixed = [items[0], { slug: 'two', imageUrl: 'https://img.test/2.png' }]
    const second = data<{ complete: boolean; results: { slug: string; status: string }[] }>(await invokeTool('bulk_upload_post_covers', { posts: fixed }, admin))
    expect(second.complete).toBe(true)
    expect(second.results.map((r) => [r.slug, r.status])).toEqual([['one', 'unchanged'], ['two', 'ok']])
    expect(await countRows('media')).toBe(mediaAfterFirst + 1)
  })

  test('a batch over the limit is refused before any work', async () => {
    const posts = Array.from({ length: 21 }, (_, i) => ({ slug: `p${i}`, imageUrl: 'https://img.test/1.png' }))
    expect(errorCode(await invokeTool('bulk_upload_post_covers', { posts }, admin))).toBe('invalid_request')
    expect(remote.requested).toEqual([])
  })
})

describe('F06 · deleting media accounts for every object', () => {
  async function uploaded(seed = 1, name = 'pic.png') {
    remote.files.set(`https://img.test/${seed}/${name}`, await png(900, 600, seed))
    return data<{ _id: string; key: string }>(await invokeTool('upload_image', { url: `https://img.test/${seed}/${name}`, folder: 'images' }, admin))
  }

  test('a clean delete removes the row and every object', async () => {
    const row = await uploaded()
    const result = data<{ storage: { status: string; pendingKeys: string[] } }>(await invokeTool('delete_media', { id: row._id }, admin))
    expect(result.storage.status).toBe('complete')
    expect(storage.objects.size).toBe(0)
    expect(await countRows('media')).toBe(0)
  })

  test('a storage failure is reported as pending and retried later', async () => {
    const row = await uploaded()
    storage.failAllDeletes = true
    const result = data<{ deleted: boolean; storage: { status: string; pendingKeys: string[] } }>(await invokeTool('delete_media', { id: row._id }, admin))
    expect(result.deleted).toBe(true)
    expect(result.storage.status).toBe('pending')
    expect(result.storage.pendingKeys.length).toBeGreaterThan(0)
    expect(await countRows('storage_cleanups')).toBe(result.storage.pendingKeys.length)

    storage.failAllDeletes = false
    await db.update(storageCleanups).set({ nextAttemptAt: new Date(0) })
    const sweep = await retryStorageCleanups()
    expect(sweep.deleted).toBe(result.storage.pendingKeys.length)
    expect(await countRows('storage_cleanups')).toBe(0)
    expect(storage.objects.size).toBe(0)
  })

  test('an object shared with another media row is kept', async () => {
    const row = await uploaded()
    const [twin] = await db.select().from(media).where(eq(media._id, row._id))
    await db.insert(media).values(omit(twin, '_id'))
    const result = data<{ storage: { sharedKeys: string[]; deletedKeys: string[] } }>(await invokeTool('delete_media', { id: row._id }, admin))
    expect(result.storage.sharedKeys).toContain(row.key)
    expect(result.storage.deletedKeys).toEqual([])
    expect(storage.objects.has(row.key)).toBe(true)
  })

  test('media in use is refused with its references unless forced', async () => {
    const row = await uploaded()
    const post = await seedPost('with-cover', { coverImage: row._id })
    await db.insert(heroContents).values({ title: 'Hero', backgroundPoster: row._id })

    const refused = await invokeTool('delete_media', { id: row._id }, admin)
    expect(errorCode(refused)).toBe('conflict')
    const references = (refused.structuredContent as { error: { details: { references: { table: string }[] } } }).error.details.references
    expect(references.map((ref) => ref.table).sort()).toEqual(['hero_contents', 'newsroom_posts'])
    expect(await countRows('media')).toBe(1)

    data(await invokeTool('delete_media', { id: row._id, force: true }, admin))
    const [after] = await db.select().from(newsroomPosts).where(eq(newsroomPosts._id, post._id))
    expect(after.coverImage).toBeNull()
    const [hero] = await db.select().from(heroContents)
    expect(hero.backgroundPoster).toBeNull()
  })

  test('the diagnostic tool is not in the production catalog', () => {
    expect(WEBSITE_MCP_CATALOG.tools.some((tool) => tool.name === 'debug_upload_test')).toBe(false)
  })
})

describe('F07 · annotations describe real behaviour, and reads never write', () => {
  test('every write declares its effects, and every undo names a real tool', () => {
    const names = new Set(WEBSITE_MCP_CATALOG.tools.map((tool) => tool.name))
    for (const tool of WEBSITE_MCP_CATALOG.tools) {
      const access = MCP_TOOL_ACCESS[tool.name]
      if (access.kind !== 'write') {
        expect([tool.name, tool.idempotency, tool.rollback, tool.effect]).toEqual([tool.name, 'none', 'none', 'read'])
        continue
      }
      const effects = MCP_WRITE_EFFECTS[tool.name]
      expect(effects).toBeDefined()
      if (effects.rollback === 'manual') expect(names.has(effects.undo ?? '')).toBe(true)
    }
  })

  test('every write accepts an idempotency key, and creates are not marked repeat-safe', () => {
    for (const tool of WEBSITE_MCP_CATALOG.tools) {
      if (MCP_TOOL_ACCESS[tool.name].kind !== 'write') continue
      expect([tool.name, tool.idempotency]).toEqual([tool.name, 'supported'])
      expect(Object.keys((tool.inputSchema as { properties: Record<string, unknown> }).properties)).toContain('idempotencyKey')
      if (/^(create|add|upload|bulk|replace|sync)_/.test(tool.name)) expect([tool.name, MCP_WRITE_EFFECTS[tool.name].repeatSafe]).toEqual([tool.name, false])
    }
  })

  test('update tools really are idempotent: a repeat leaves the same state', async () => {
    await seedPost('same')
    const first = data<Record<string, unknown>>(await invokeTool('update_post', { slug: 'same', title: 'New title', tags: ['a'] }, admin))
    const second = data<Record<string, unknown>>(await invokeTool('update_post', { slug: 'same', title: 'New title', tags: ['a'] }, admin))
    expect(omit(second, 'updatedAt')).toEqual(omit(first, 'updatedAt'))
    expect(await countRows('newsroom_posts')).toBe(1)
  })

  test('get_hero on an empty table returns defaults without inserting a row', async () => {
    const hero = data<{ _id: null; title: string }>(await invokeTool('get_hero', {}, admin))
    expect(hero._id).toBeNull()
    expect(hero.title.length).toBeGreaterThan(0)
    expect(await countRows('hero_contents')).toBe(0)
  })

  test('no read tool changes any table', async () => {
    const before = await tableCounts()
    for (const tool of WEBSITE_MCP_CATALOG.tools) {
      if (MCP_TOOL_ACCESS[tool.name].kind === 'write') continue
      await invokeTool(tool.name, sampleReadInput(tool.name), admin)
    }
    expect(await tableCounts()).toEqual(before)
  })
})

describe('F07 · idempotency keys', () => {
  test('a retry with the same key and input replays the result without writing again', async () => {
    const first = data<{ _id: string }>(await invokeTool('create_course', { title: 'Keyed', idempotencyKey: 'key-00000001' }, admin))
    const again = data<{ _id: string }>(await invokeTool('create_course', { title: 'Keyed', idempotencyKey: 'key-00000001' }, admin))
    expect(again._id).toBe(first._id)
    expect(await countRows('courses')).toBe(1)
  })

  test('the same key with different input is an idempotency_conflict', async () => {
    data(await invokeTool('create_course', { title: 'Keyed', idempotencyKey: 'key-00000002' }, admin))
    expect(errorCode(await invokeTool('create_course', { title: 'Other', idempotencyKey: 'key-00000002' }, admin))).toBe('idempotency_conflict')
    expect(await countRows('courses')).toBe(1)
  })

  test('concurrent duplicates with one key write once', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => invokeTool('create_job', { title: 'Race', department: 'Eng', idempotencyKey: 'key-00000003' }, admin)))
    const ids = new Set(results.map((result) => data<{ _id: string }>(result)._id))
    expect(ids.size).toBe(1)
    expect(await countRows('jobs')).toBe(1)
  })

  test('the key is scoped to the acting account', async () => {
    const other = { actorId: 'admin-two', requestId: 't' }
    process.env.OXY_ADMIN_USER_IDS = 'admin-account,admin-two'
    const { config } = await import('../config.js')
    const previous = config.adminUserIds
    config.adminUserIds = ['admin-account', 'admin-two']
    try {
      data(await invokeTool('create_course', { title: 'Scoped', idempotencyKey: 'key-00000004' }, admin))
      data(await invokeTool('create_course', { title: 'Scoped', idempotencyKey: 'key-00000004' }, other))
      expect(await countRows('courses')).toBe(2)
    } finally {
      config.adminUserIds = previous
    }
  })

  test('a failing keyed call rolls back its partial writes and replays the same error', async () => {
    const first = await invokeTool('create_job', { title: 'Dup', department: 'Eng', slug: 'taken', idempotencyKey: 'key-00000005' }, admin)
    expect(first.isError).toBeUndefined()
    const conflictCall = await invokeTool('create_team_member', { name: 'X', role: 'Y', slug: 'bad slug!', idempotencyKey: 'key-00000006' }, admin)
    expect(errorCode(conflictCall)).toBe('invalid_request')
    expect(await countRows('team_members')).toBe(0)
  })
})

describe('F11 · errors are safe and the actor comes from authentication', () => {
  test('an unexpected failure returns a reference, never SQL or a stack', async () => {
    const result = await invokeTool('list_courses', { category: 'x'.repeat(10), page: 1, limit: -5 }, admin)
    const text = result.content[0].text
    expect(text).not.toMatch(/select |insert |Failed query|\n\s+at /i)
    if (result.isError) {
      const { error } = result.structuredContent as { error: { code: string; reference?: string } }
      if (error.code === 'internal_error') expect(error.reference).toMatch(/[0-9a-f-]{36}/)
    }
  })

  test('a post created without an author is attributed to the acting account, not a placeholder', async () => {
    const post = data<{ oxyUserId: string }>(await invokeTool('create_post', { title: 'Hello', coverImage: '' }, admin))
    expect(post.oxyUserId).toBe('admin-account')
  })

  test('an image that is not an image is refused before anything is stored', async () => {
    remote.files.set('https://img.test/evil.svg', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))
    remote.files.set('https://img.test/fake.png', Buffer.from('not really a png'))
    expect(errorCode(await invokeTool('upload_image', { url: 'https://img.test/evil.svg' }, admin))).toBe('invalid_request')
    expect(errorCode(await invokeTool('upload_image', { url: 'https://img.test/fake.png' }, admin))).toBe('invalid_request')
    expect(storage.objects.size).toBe(0)
    expect(await countRows('media')).toBe(0)
  })

  test('a folder cannot escape the library prefix', async () => {
    remote.files.set('https://img.test/ok.png', await png())
    expect(errorCode(await invokeTool('upload_image', { url: 'https://img.test/ok.png', folder: '../secrets' }, admin))).toBe('invalid_request')
  })
})

async function tableCounts(): Promise<Record<string, number>> {
  const tables = ['courses', 'help_articles', 'hero_contents', 'jobs', 'locales', 'media', 'newsroom_posts', 'pricing_plans', 'resources', 'storage_cleanups', 'team_members', 'testimonials', 'translations', 'site_settings', 'pages']
  return Object.fromEntries(await Promise.all(tables.map(async (table) => [table, await countRows(table)] as const)))
}

function sampleReadInput(name: string): Record<string, unknown> {
  const samples: Record<string, Record<string, unknown>> = {
    get_page: { slug: 'x' }, get_post: { slug: 'x' }, get_post_with_media: { slug: 'x' }, search_posts: { query: 'x' },
    get_job: { slug: 'x' }, get_team_member: { slug: 'x' }, get_media: { id: 'x' }, get_translations: { collection: 'pages', locale: 'es' },
    get_translation: { collection: 'pages', documentId: 'x', locale: 'es' }, get_category: { slug: 'x' }, get_product: { productId: 'x' },
    get_course: { slug: 'x' }, get_resource: { slug: 'x' }, get_help_article: { slug: 'x' }, get_referral: { code: 'x' },
  }
  return samples[name] ?? {}
}

// Keep imports referenced for the type checker.
void [courses, helpArticles, resources, teamMembers]
