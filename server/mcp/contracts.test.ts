import { beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import {
  categories, courses, helpArticles, jobs, locales, newsroomPosts, pages, pricingPlans, products, resources, teamMembers, translations,
} from '../db/schema/index.js'
import { invokeTool, WEBSITE_MCP_CATALOG } from '../mcp.js'
import { MCP_TOOL_ACCESS } from '../mcpAccess.js'
import { ensureApp } from '../test/app.js'
import { admin, countRows, data, errorCode, reader, resetDatabase } from '../test/helpers.js'

/* Issue #108, phases B–D: one contract per tool for admins and readers, input
   limits, explicit filter semantics, localized reads, validated translation
   patches, optimistic concurrency and previews. */

beforeAll(ensureApp)
beforeEach(resetDatabase)

interface Seed {
  post: typeof newsroomPosts.$inferSelect
  draft: typeof newsroomPosts.$inferSelect
  product: typeof products.$inferSelect
  category: typeof categories.$inferSelect
}

async function seed(): Promise<Seed> {
  await db.insert(locales).values([
    { code: 'en', slug: 'en', name: 'English', nativeName: 'English', isDefault: true },
    { code: 'es', slug: 'es', name: 'Spanish', nativeName: 'Español' },
  ])
  const [category] = await db.insert(categories).values({ slug: 'social', label: 'Social', scope: 'apps' }).returning()
  const [product] = await db.insert(products).values({ productId: 'mention', name: 'Mention', href: 'https://mention.earth', brand: '#111111', mark: 'M', category: category._id }).returning()
  const [post] = await db.insert(newsroomPosts).values({ title: 'Launch', slug: 'launch', resume: 'We launched', content: '# Body', featured: true, products: [product._id], oxyUserId: 'author-1' }).returning()
  const [draft] = await db.insert(newsroomPosts).values({ title: 'Secret', slug: 'secret', status: 'draft' }).returning()
  await db.insert(newsroomPosts).values({ title: 'Plain', slug: 'plain', featured: false })
  await db.insert(pages).values({ slug: 'home', title: 'Home' })
  await db.insert(jobs).values([{ title: 'Engineer', slug: 'engineer', department: 'Eng' }, { title: 'Old role', slug: 'old-role', department: 'Eng', active: false }])
  await db.insert(teamMembers).values([{ name: 'Ada', slug: 'ada', role: 'Eng' }, { name: 'Gone', slug: 'gone', role: 'Eng', active: false }])
  await db.insert(courses).values({ title: 'Intro', slug: 'intro' })
  await db.insert(resources).values({ title: 'Kit', slug: 'kit', href: '/kit' })
  await db.insert(helpArticles).values({ title: 'Reset', slug: 'reset' })
  await db.insert(pricingPlans).values({ name: 'Pro', price: { monthly: 10, annual: 100 }, ctaHref: '/buy' })
  await db.insert(translations).values({ locale: 'es', collectionName: 'newsroom', documentId: post._id, fields: { title: 'Lanzamiento', resume: 'Lanzamos' } })
  return { post, draft, product, category }
}

const READ_SAMPLES: Record<string, Record<string, unknown>> = {
  get_page: { slug: 'home' },
  get_post: { slug: 'launch' },
  get_post_with_media: { slug: 'launch' },
  search_posts: { query: 'Launch' },
  get_job: { slug: 'engineer' },
  get_team_member: { slug: 'ada' },
  get_category: { slug: 'social' },
  get_product: { productId: 'mention' },
  get_course: { slug: 'intro' },
  get_resource: { slug: 'kit' },
  get_help_article: { slug: 'reset' },
}

describe('one output contract for admins and readers', () => {
  test('every public read succeeds for both and satisfies its declared output schema', async () => {
    await seed()
    const readTools = WEBSITE_MCP_CATALOG.tools.filter((tool) => MCP_TOOL_ACCESS[tool.name].kind === 'public-read')
    expect(readTools.length).toBeGreaterThan(20)
    for (const tool of readTools) {
      if (tool.name === 'get_media') continue // needs a media row; covered by the media suite
      const input = READ_SAMPLES[tool.name] ?? {}
      for (const context of [admin, reader]) {
        const result = await invokeTool(tool.name, input, context)
        // invokeTool validates structured content against the declared schema,
        // so a success here is a success that matched it.
        expect([tool.name, context.actorId, result.isError ? result.content[0].text : 'ok']).toEqual([tool.name, context.actorId, 'ok'])
        if (tool.outputSchema) expect(result.structuredContent).toBeDefined()
      }
    }
  })

  test('a list read carries summaries, not bodies, for both', async () => {
    await seed()
    for (const context of [admin, reader]) {
      const { posts } = data<{ posts: Record<string, unknown>[] }>(await invokeTool('list_posts', {}, context))
      expect(posts.length).toBeGreaterThan(0)
      for (const post of posts) expect(post.content).toBeUndefined()
    }
    const full = data<{ posts: Record<string, unknown>[] }>(await invokeTool('list_posts', { view: 'full' }, admin))
    expect(full.posts.some((post) => post.content === '# Body')).toBe(true)
  })

  test('search_posts answers the same envelope for both', async () => {
    await seed()
    for (const context of [admin, reader]) {
      const body = data<{ posts: { slug: string }[]; total: number; page: number; pages: number }>(await invokeTool('search_posts', { query: 'Laun' }, context))
      expect(body.posts.map((post) => post.slug)).toEqual(['launch'])
      expect(body).toMatchObject({ total: 1, page: 1, pages: 1 })
    }
  })

  test('array reads are structured as { items }', async () => {
    await seed()
    for (const context of [admin, reader]) {
      const result = await invokeTool('list_jobs', {}, context)
      expect(Array.isArray((result.structuredContent as { items: unknown[] }).items)).toBe(true)
    }
  })
})

describe('input limits are enforced before any handler runs', () => {
  const bad: [string, Record<string, unknown>][] = [
    ['list_posts', { page: 0 }],
    ['list_posts', { limit: 101 }],
    ['list_courses', { limit: 2.5 }],
    ['list_media', { page: -1 }],
    ['get_translations', { collection: 'pages', locale: 'es', limit: 1000 }],
    ['create_post', { title: '' }],
    ['create_post', { title: 'x', publishedAt: 'yesterday' }],
    ['create_product', { productId: 'x', name: 'X', href: 'javascript:alert(1)', brand: '#fff', mark: 'X' }],
    ['create_product', { productId: 'x', name: 'X', href: '/x', brand: 'purple', mark: 'X' }],
    ['create_referral', { code: 'A B', name: 'x' }],
    ['create_referral', { code: 'ABC', name: 'x', commissionPercent: 12.5 }],
    ['update_team_member', { slug: 'ada', socials: { website: 'ftp://x' } }],
    ['upsert_page', { slug: 'Bad Slug', title: 'x' }],
  ]
  for (const [tool, input] of bad) {
    test(`${tool} ${JSON.stringify(input).slice(0, 60)} → invalid_request`, async () => {
      expect(errorCode(await invokeTool(tool, input, admin))).toBe('invalid_request')
    })
  }
})

describe('filters mean one thing and are never silently dropped', () => {
  test('featured: false is "not featured" for admins and refused for readers', async () => {
    await seed()
    const { posts } = data<{ posts: { slug: string }[] }>(await invokeTool('list_posts', { featured: false }, admin))
    expect(posts.map((post) => post.slug).sort()).toEqual(['plain', 'secret'])
    expect(errorCode(await invokeTool('list_posts', { featured: false }, reader))).toBe('permission_denied')
    expect(errorCode(await invokeTool('list_courses', { featured: false }, reader))).toBe('permission_denied')
  })

  test('active: false lists inactive rows for admins and is refused for readers', async () => {
    await seed()
    const all = data<{ slug: string }[]>(await invokeTool('list_jobs', { active: false }, admin))
    expect(all.map((job) => job.slug).sort()).toEqual(['engineer', 'old-role'])
    expect(errorCode(await invokeTool('list_jobs', { active: false }, reader))).toBe('permission_denied')
    expect(errorCode(await invokeTool('list_team_members', { active: false }, reader))).toBe('permission_denied')
  })

  test('admin-only filters are refused to readers', async () => {
    await seed()
    expect(errorCode(await invokeTool('list_products', { category: 'social' }, reader))).toBe('permission_denied')
    expect(errorCode(await invokeTool('list_changelog', { search: 'x' }, reader))).toBe('permission_denied')
    expect(errorCode(await invokeTool('list_courses', { level: 'advanced' }, reader))).toBe('permission_denied')
  })

  test('product and author filters work the same for both', async () => {
    await seed()
    for (const context of [admin, reader]) {
      const byProduct = data<{ posts: { slug: string }[] }>(await invokeTool('list_posts', { product: 'mention' }, context))
      expect(byProduct.posts.map((post) => post.slug)).toEqual(['launch'])
      const byAuthor = data<{ posts: { slug: string }[] }>(await invokeTool('list_posts', { author: 'author-1' }, context))
      expect(byAuthor.posts.map((post) => post.slug)).toEqual(['launch'])
    }
  })
})

describe('localized reads', () => {
  test('admins and readers read the same translation', async () => {
    await seed()
    for (const context of [admin, reader]) {
      const post = data<{ title: string }>(await invokeTool('get_post', { slug: 'launch', locale: 'es' }, context))
      expect(post.title).toBe('Lanzamiento')
      const { posts } = data<{ posts: { slug: string; title: string }[] }>(await invokeTool('list_posts', { locale: 'es' }, context))
      expect(posts.find((p) => p.slug === 'launch')?.title).toBe('Lanzamiento')
    }
  })

  test('a mixed-case locale code is served in that locale on both paths', async () => {
    const { post } = await seed()
    await db.insert(locales).values({ code: 'pt-BR', slug: 'pt-br', name: 'Portuguese', nativeName: 'Português' })
    await db.insert(translations).values({ locale: 'pt-BR', collectionName: 'newsroom', documentId: post._id, fields: { title: 'Lançamento' } })
    for (const context of [admin, reader]) {
      const translated = data<{ title: string }>(await invokeTool('get_post', { slug: 'launch', locale: 'pt-br' }, context))
      expect([context.actorId, translated.title]).toEqual([context.actorId, 'Lançamento'])
    }
  })

  test('an unknown locale is refused for both instead of silently served in English', async () => {
    await seed()
    for (const context of [admin, reader]) {
      expect(errorCode(await invokeTool('get_post', { slug: 'launch', locale: 'fr' }, context))).toBe('invalid_request')
    }
  })
})

describe('F13 · translation patches', () => {
  let postId: string
  beforeEach(async () => {
    postId = (await seed()).post._id
  })

  test('a partial update merges and keeps the other overrides', async () => {
    const result = data<{ fields: Record<string, string>; changes: { changed: string[] } }>(
      await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields: { title: 'Nuevo título' } }, admin),
    )
    expect(result.fields).toEqual({ title: 'Nuevo título', resume: 'Lanzamos' })
    expect(result.changes.changed).toEqual(['title'])
  })

  test('removeFields drops one override; replace sets exactly what is sent', async () => {
    const removed = data<{ fields: Record<string, string> }>(await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields: {}, removeFields: ['resume'] }, admin))
    expect(removed.fields).toEqual({ title: 'Lanzamiento' })
    const replaced = data<{ fields: Record<string, string> }>(await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields: { content: '# Cuerpo' }, mode: 'replace' }, admin))
    expect(replaced.fields).toEqual({ content: '# Cuerpo' })
  })

  test('identity, state and reference fields cannot be translated', async () => {
    for (const fields of [{ slug: 'hijack' }, { status: 'draft' }, { oxyUserId: 'someone' }, { coverImage: 'x' }, { publishedAt: '2020-01-01' }]) {
      const result = await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields }, admin)
      expect([JSON.stringify(fields), errorCode(result)]).toEqual([JSON.stringify(fields), 'invalid_request'])
    }
    const [row] = await db.select().from(translations).where(eq(translations.documentId, postId))
    expect(row.fields).toEqual({ title: 'Lanzamiento', resume: 'Lanzamos' })
  })

  test('a value of the wrong shape, a missing document or the default locale is refused', async () => {
    expect(errorCode(await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields: { title: 42 } }, admin))).toBe('invalid_request')
    expect(errorCode(await invokeTool('upsert_translation', { collection: 'newsroom', documentId: 'ffffffffffffffffffffffff', locale: 'es', fields: { title: 'x' } }, admin))).toBe('not_found')
    expect(errorCode(await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'en', fields: { title: 'x' } }, admin))).toBe('invalid_request')
  })

  test('dryRun reports the result without saving; a stale expectedUpdatedAt is refused', async () => {
    const preview = data<{ dryRun: boolean; fields: Record<string, string> }>(await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields: { title: 'Borrador' }, dryRun: true }, admin))
    expect(preview.fields.title).toBe('Borrador')
    const [unchanged] = await db.select().from(translations).where(eq(translations.documentId, postId))
    expect(unchanged.fields.title).toBe('Lanzamiento')
    const stale = await invokeTool('upsert_translation', { collection: 'newsroom', documentId: postId, locale: 'es', fields: { title: 'x' }, expectedUpdatedAt: '2001-01-01T00:00:00.000Z' }, admin)
    expect(errorCode(stale)).toBe('precondition_failed')
  })

  test('review lists source values and untranslated fields', async () => {
    const result = data<{ review: { source: Record<string, string>; untranslated: string[] } }>(await invokeTool('get_translation', { collection: 'newsroom', documentId: postId, locale: 'es', includeSource: true }, admin))
    expect(result.review.source).toEqual({ title: 'Launch', resume: 'We launched' })
    expect(result.review.untranslated).toContain('content')
  })

  test('get_translations is paginated', async () => {
    const body = data<{ translations: unknown[]; total: number; pages: number }>(await invokeTool('get_translations', { collection: 'newsroom', locale: 'es', limit: 1 }, admin))
    expect(body).toMatchObject({ total: 1, pages: 1 })
  })
})

describe('concurrent edits and previews', () => {
  test('a stale expectedUpdatedAt is refused with the current value, a fresh one applies', async () => {
    await seed()
    const post = data<{ updatedAt: string }>(await invokeTool('get_post', { slug: 'launch' }, admin))
    data(await invokeTool('update_post', { slug: 'launch', title: 'First edit', expectedUpdatedAt: post.updatedAt }, admin))
    const stale = await invokeTool('update_post', { slug: 'launch', title: 'Second edit', expectedUpdatedAt: post.updatedAt }, admin)
    expect(errorCode(stale)).toBe('precondition_failed')
    expect((stale.structuredContent as { error: { details: { currentUpdatedAt: string } } }).error.details.currentUpdatedAt).toBeTruthy()
    const [row] = await db.select().from(newsroomPosts).where(eq(newsroomPosts.slug, 'launch'))
    expect(row.title).toBe('First edit')
  })

  test('two editors racing on the same version: exactly one wins', async () => {
    await seed()
    const post = data<{ updatedAt: string }>(await invokeTool('get_post', { slug: 'launch' }, admin))
    const results = await Promise.all(['A', 'B', 'C'].map((title) => invokeTool('update_post', { slug: 'launch', title, expectedUpdatedAt: post.updatedAt }, admin)))
    expect(results.filter((result) => !result.isError)).toHaveLength(1)
    expect(results.filter((result) => errorCode(result) === 'precondition_failed')).toHaveLength(2)
  })

  test('the precondition works on rows created by the database default timestamp', async () => {
    await seed()
    const job = data<{ updatedAt: string }>(await invokeTool('get_job', { slug: 'engineer' }, admin))
    data(await invokeTool('update_job', { slug: 'engineer', subtitle: 'Now hiring', expectedUpdatedAt: job.updatedAt }, admin))
  })

  test('a delete dry run changes nothing and reports the translations that would go', async () => {
    await seed()
    const preview = data<{ deleted: boolean; dryRun: boolean; impact: { translations: number }; updatedAt: string }>(await invokeTool('delete_post', { slug: 'launch', dryRun: true }, admin))
    expect(preview).toMatchObject({ deleted: false, dryRun: true, impact: { translations: 1 } })
    expect(await countRows('newsroom_posts')).toBe(3)
    // Executing a preview that has gone stale is refused.
    data(await invokeTool('update_post', { slug: 'launch', title: 'Edited after preview' }, admin))
    expect(errorCode(await invokeTool('delete_post', { slug: 'launch', expectedUpdatedAt: preview.updatedAt }, admin))).toBe('precondition_failed')
    const deleted = data<{ translationsRemoved: number }>(await invokeTool('delete_post', { slug: 'launch' }, admin))
    expect(deleted.translationsRemoved).toBe(1)
    expect(await countRows('translations')).toBe(0)
  })

  test('replace_pricing dry run lists the plan diff and writes nothing', async () => {
    await seed()
    const [plan] = await db.select().from(pricingPlans)
    const preview = data<{ added: string[]; removed: unknown[]; changed: { fields: string[] }[] }>(await invokeTool('replace_pricing', {
      plans: [{ _id: plan._id, name: 'Pro', price: { monthly: 12, annual: 100 }, ctaHref: '/buy' }, { name: 'Team', price: { monthly: 30, annual: 300 } }],
      dryRun: true,
    }, admin))
    expect(preview.added).toEqual(['Team'])
    expect(preview.removed).toEqual([])
    expect(preview.changed[0].fields).toEqual(['price'])
    expect(await countRows('pricing_plans')).toBe(1)
  })
})

describe('products, categories and newsroom associations', () => {
  test('a product category is set by slug, keeps section in step, and clears', async () => {
    await seed()
    const created = data<{ category: { slug: string }; section: string }>(await invokeTool('create_product', { productId: 'alia', name: 'Alia', href: 'https://alia.onl', brand: '#7c3aed', mark: 'A', category: 'social' }, admin))
    expect(created.category.slug).toBe('social')
    expect(created.section).toBe('social')
    const cleared = data<{ category: null }>(await invokeTool('update_product', { productId: 'alia', category: '' }, admin))
    expect(cleared.category).toBeNull()
    expect(errorCode(await invokeTool('update_product', { productId: 'alia', category: 'nope' }, admin))).toBe('invalid_request')
  })

  test('posts reference products by productId, and unknown ones are refused', async () => {
    await seed()
    const post = data<{ products: { productId: string }[] }>(await invokeTool('create_post', { title: 'About Mention', products: ['mention'] }, admin))
    expect(post.products.map((p) => p.productId)).toEqual(['mention'])
    expect(errorCode(await invokeTool('create_post', { title: 'Bad', products: ['ghost'] }, admin))).toBe('invalid_request')
    expect(await countRows('newsroom_posts')).toBe(4)
  })
})

describe('discovery', () => {
  test('describe_access tells a reader what is available without trial and error', async () => {
    const body = data<{ account: { role: string }; domains: Record<string, { name: string; available: boolean; effect: string }[]> }>(await invokeTool('describe_access', {}, reader))
    expect(body.account.role).toBe('reader')
    const tools = Object.values(body.domains).flat()
    expect(tools.find((tool) => tool.name === 'create_post')).toMatchObject({ available: false, effect: 'write' })
    expect(tools.find((tool) => tool.name === 'list_posts')).toMatchObject({ available: true })
    expect(tools).toHaveLength(WEBSITE_MCP_CATALOG.tools.length)
  })

  test('describe_access marks every tool available to an admin', async () => {
    const body = data<{ account: { role: string }; domains: Record<string, { available: boolean }[]> }>(await invokeTool('describe_access', {}, admin))
    expect(body.account.role).toBe('website-admin')
    expect(Object.values(body.domains).flat().every((tool) => tool.available)).toBe(true)
  })

  test('get_mcp_status reports the service state', async () => {
    const status = data<{ alive: boolean; catalogRegistration: { state: string } }>(await invokeTool('get_mcp_status', {}, reader))
    expect(status.alive).toBe(true)
    expect(status.catalogRegistration.state).toBe('disabled')
  })
})
