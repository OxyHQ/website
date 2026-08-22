import postgres from 'postgres'
import { parseArticleFence } from '../src/components/slices/article-blocks/schema'

type ArticleBlock = { name: string; payload: Record<string, unknown> }

export interface ArticleEnrichment {
  beforeHeading: string
  block: ArticleBlock
}

/**
 * Optional editorial enhancements for articles whose subject benefits from a
 * structured summary. An absent slug is intentional: prose-first essays keep
 * their original Markdown and still use the shared article layout.
 */
export const ARTICLE_ENRICHMENTS: Readonly<Record<string, ArticleEnrichment>> = {
  'bloom-color-system-theme-recipes': {
    beforeHeading: '## One source instead of several palettes',
    block: {
      name: 'article-stats',
      payload: {
        eyebrow: 'Bloom 1.0.3',
        title: 'One registry, multiple ways to compose color',
        items: [
          { value: '64', label: 'Named color recipes' },
          { value: '46', label: 'Curated pairings' },
          { value: '18', label: 'Dynamically derived pairings' },
        ],
        width: 'wide',
      },
    },
  },
  'mention-joins-the-fediverse': {
    beforeHeading: '## What federation means in Mention',
    block: {
      name: 'article-comparison',
      payload: {
        eyebrow: 'What changed',
        title: 'A wider network without surrendering control',
        panels: [
          {
            label: 'A closed boundary',
            content: 'Reaching people on another service requires another account and leaves each conversation inside one product.',
          },
          {
            label: 'Mention with ActivityPub',
            content: 'Compatible services can discover accounts and exchange eligible posts, follows and interactions while fediverse sharing remains an explicit choice.',
          },
        ],
        width: 'wide',
      },
    },
  },
  'homiio-ethical-housing-beyond-listings': {
    beforeHeading: '## A home is not an advert',
    block: {
      name: 'article-comparison',
      payload: {
        eyebrow: 'The core distinction',
        title: 'A home should outlive the advert that describes it',
        panels: [
          {
            label: 'Temporary listing',
            content: 'An offer can change, disappear or be duplicated by several agencies. It is a sourced claim about a place.',
          },
          {
            label: 'Durable home',
            content: 'The physical dwelling keeps its history, reviews, rent records and relevant events after any one advert expires.',
          },
        ],
        width: 'wide',
      },
    },
  },
  'housing-is-a-right-homiio': {
    beforeHeading: '## The market sees a transaction; a person lives the consequences',
    block: {
      name: 'article-callout',
      payload: {
        eyebrow: 'Housing as a right',
        title: 'A roof is only the beginning',
        body: 'Adequate housing also includes **security of tenure, essential services, affordability, habitability, accessibility, location, and cultural adequacy**.',
        tone: 'tertiary',
        width: 'prose',
      },
    },
  },
  'identity-layer-under-alia': {
    beforeHeading: '## Identity Before Intelligence',
    block: {
      name: 'article-callout',
      payload: {
        eyebrow: 'Identity before intelligence',
        title: 'Permissions live with the person',
        body: 'When Alia needs to act inside Mention, Homiio, or another Oxy product, access comes from the identity layer and can be revoked in one place.',
        tone: 'primary',
        width: 'prose',
      },
    },
  },
  'alia-major-update-voice-canvas-channels-workflows': {
    beforeHeading: '## Voice Mode with LiveKit',
    block: {
      name: 'article-tabs',
      payload: {
        label: 'Explore the update',
        tabs: [
          { id: 'voice', label: 'Voice', content: 'Real-time streaming audio, natural turn-taking, interruptions, and speech-to-text.' },
          { id: 'canvas', label: 'Canvas', content: 'Interactive interfaces generated inside the conversation instead of static text alone.' },
          { id: 'channels', label: 'Channels', content: 'One assistant available through several communication surfaces.' },
          { id: 'workflows', label: 'Workflows', content: 'A durable execution layer for multi-step jobs, tools, and automations.' },
        ],
        width: 'wide',
      },
    },
  },
  'introducing-rooms-live-audio-on-mention': {
    beforeHeading: '## How It Works Under the Hood',
    block: {
      name: 'article-tabs',
      payload: {
        label: 'How Rooms is organized',
        tabs: [
          { id: 'control-plane', label: 'Control plane', content: 'Socket.IO coordinates participants, requests, room lifecycle, and live interface state.' },
          { id: 'media-plane', label: 'Media plane', content: 'A self-hosted LiveKit SFU carries real-time WebRTC audio.' },
          { id: 'roles', label: 'Roles', content: 'Hosts, speakers, and listeners receive different permissions for a predictable live session.' },
        ],
        width: 'wide',
      },
    },
  },
  'mention-updates-search-muting-trending-february-2026': {
    beforeHeading: '## New Features',
    block: {
      name: 'article-table',
      payload: {
        caption: 'The February release in two workstreams',
        columns: ['Area', 'What shipped'],
        rows: [
          ['Product', 'Advanced search, muting, reporting, trending, post actions, and image optimization'],
          ['Engineering', 'Stricter TypeScript, structured frontend logging, and richer backend error context'],
        ],
        width: 'wide',
      },
    },
  },
  'security-hardening-oxy-services-february-2026': {
    beforeHeading: '## Critical Fixes',
    block: {
      name: 'article-table',
      payload: {
        caption: 'Fixes shipped after the security review',
        columns: ['Severity', 'Fixes', 'Areas'],
        rows: [
          ['Critical', '3', 'Stripe webhooks, billing credit caps, and FedCM CORS'],
          ['High', '3', 'Authentication and session protections'],
          ['Medium', '2', 'Defence-in-depth hardening'],
        ],
        width: 'wide',
      },
    },
  },
  'introducing-alia-oxy-ai-assistant': {
    beforeHeading: '## The Future: A Fully Autonomous AI',
    block: {
      name: 'article-table',
      payload: {
        caption: 'Alia model tiers described at launch',
        columns: ['Tier', 'Designed for'],
        rows: [
          ['Lite', 'Fast everyday assistance'],
          ['Core', 'Balanced conversation and tool use'],
          ['Pro', 'More demanding professional work'],
          ['Ultra', 'Complex, long-running tasks'],
          ['Codea', 'Software development workflows'],
        ],
        width: 'wide',
      },
    },
  },
}

function serializeFence(name: string, payload: Record<string, unknown>): string {
  return `\`\`\`${name}\n${JSON.stringify(payload, null, 2)}\n\`\`\``
}

export function enrichNewsroomMarkdown(
  markdown: string,
  options: { slug: string },
): { content: string; changed: boolean; blockCount: number } {
  if (/^```article-/m.test(markdown)) {
    return { content: markdown, changed: false, blockCount: 0 }
  }

  const enrichment = ARTICLE_ENRICHMENTS[options.slug]
  if (!enrichment) return { content: markdown, changed: false, blockCount: 0 }

  const parsed = parseArticleFence(enrichment.block.name, JSON.stringify(enrichment.block.payload))
  if (!parsed?.ok) {
    throw new Error(`Invalid ${enrichment.block.name} block for ${options.slug}: ${parsed?.message ?? 'unknown block'}`)
  }

  const markerIndex = markdown.indexOf(enrichment.beforeHeading)
  if (markerIndex < 0) {
    throw new Error(`Insertion heading not found for ${options.slug}: ${enrichment.beforeHeading}`)
  }

  const before = markdown.slice(0, markerIndex).trimEnd()
  const after = markdown.slice(markerIndex).trimStart()
  const content = `${before}\n\n${serializeFence(enrichment.block.name, enrichment.block.payload)}\n\n${after}`
  return { content, changed: content !== markdown, blockCount: 1 }
}

interface PostRow {
  _id: string
  slug: string
  status: string
  content: string
  oxyUserId: string | null
  authorUsername: string | null
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  const apply = process.argv.includes('--apply')
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    const result = await sql.begin(async (transaction) => {
      const posts = await transaction<PostRow[]>`
        select
          _id,
          slug,
          status,
          content,
          oxy_user_id as "oxyUserId",
          author_username as "authorUsername"
        from newsroom_posts
        order by status, published_at desc, _id asc
        for update
      `

      if (posts.length === 0) throw new Error('No Newsroom posts found; refusing a vacuous migration')
      const publishedSlugs = new Set(posts.filter((post) => post.status === 'published').map((post) => post.slug))
      const unknownTargets = Object.keys(ARTICLE_ENRICHMENTS).filter((slug) => !publishedSlugs.has(slug))
      if (unknownTargets.length > 0) {
        throw new Error(`Curated article targets are not published: ${unknownTargets.join(', ')}`)
      }

      let changedPosts = 0
      let changedAuthors = 0
      let generatedBlocks = 0

      for (const post of posts) {
        const enriched = post.status === 'published'
          ? enrichNewsroomMarkdown(post.content, { slug: post.slug })
          : { content: post.content, changed: false, blockCount: 0 }
        const authorUsername = post.oxyUserId === 'mcp-admin' && !post.authorUsername
          ? 'Oxy Editorial'
          : post.authorUsername
        const authorChanged = authorUsername !== post.authorUsername
        if (!enriched.changed && !authorChanged) continue
        if (enriched.changed) {
          changedPosts += 1
          generatedBlocks += enriched.blockCount
        }
        if (authorChanged) changedAuthors += 1

        if (apply) {
          const updated = await transaction`
            update newsroom_posts
            set
              content = ${enriched.content},
              author_username = ${authorUsername},
              updated_at = now()
            where
              _id = ${post._id}
              and content = ${post.content}
              and author_username is not distinct from ${post.authorUsername}
            returning _id
          `
          if (updated.length !== 1) throw new Error(`Concurrent article change detected for ${post.slug}`)
        }
      }

      return {
        mode: apply ? 'apply' : 'check',
        posts: posts.length,
        published: publishedSlugs.size,
        curatedTargets: Object.keys(ARTICLE_ENRICHMENTS).length,
        proseOnlyPublished: publishedSlugs.size - Object.keys(ARTICLE_ENRICHMENTS).length,
        changedPosts,
        changedAuthors,
        generatedBlocks,
      }
    })
    console.info(JSON.stringify(result, null, 2))
  } finally {
    await sql.end()
  }
}

if (import.meta.main) await run()
