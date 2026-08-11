/**
 * Seed script — populates Postgres with the original static content.
 * Always drops existing data first (full reset).
 *
 * Usage: DATABASE_URL=… bun run seed
 */
import { closeDatabase, db } from './db/postgres.js'
import {
  categories,
  changelogEntries,
  courses,
  footers,
  helpArticles,
  heroContents,
  jobs,
  media,
  navigationDropdowns,
  newsroomPosts,
  pages,
  pricingPlans,
  products,
  resources,
  siteSettings,
  teamMembers,
  testimonials,
  trackedRepos,
} from './db/schema/index.js'
import {
  DEFAULT_CAROUSEL_SLOTS,
  DEFAULT_HERO_BG_MP4,
  DEFAULT_HERO_BG_WEBM,
  DEFAULT_HERO_POSTER,
  DEFAULT_HERO_TITLE,
} from './constants/hero.js'

async function seed() {
  // ── Drop every seeded table (full reset) ──
  // One transaction: a half-cleared database is worse than either end state,
  // and the order matters because products and posts reference media.
  await db.transaction(async (tx) => {
    for (const table of [
      navigationDropdowns, footers, heroContents, products, pricingPlans, testimonials,
      changelogEntries, jobs, siteSettings, pages, newsroomPosts, courses, resources,
      helpArticles, trackedRepos, teamMembers, categories, media,
    ]) {
      await tx.delete(table as never)
    }
  })
  console.log('Cleared all tables')

  // ── Media helper: create a media row from a URL ──
  async function seedMedia(url: string, filename: string, mimeType = 'image/jpeg'): Promise<string> {
    const [row] = await db
      .insert(media)
      .values({
        url, filename, key: new URL(url).pathname.slice(1) || filename,
        mimeType, size: 0, alt: '', tags: [], folder: 'seed',
        thumbnails: { sm: '', md: '', lg: '' },
      })
      .returning({ id: media._id })
    return row.id
  }

  // ── App icons ──
  // Shipped in the repo under `public/images/apps` and registered in the media
  // library, so a product references its icon exactly the way it references an
  // upload. Path-only URLs: whichever host renders the site serves them.
  //
  // A product with no entry keeps its letter mark. Homiio and Syra ship the
  // unmodified Expo template icon, and Codea has no repository yet, so there is
  // nothing here to point at for those three.
  const MIME_BY_EXTENSION: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  }

  const APP_ICONS: Record<string, string> = {
    accounts: '/images/apps/accounts.png',
    alia: '/images/apps/alia.svg',
    astro: '/images/astro/icon.png',
    // Not a product: Bloom is a hand-curated Platform item, and its icon is
    // referenced from the dropdown's items JSON.
    bloom: '/images/apps/bloom.png',
    clarity: '/images/apps/clarity.png',
    codea: '/images/apps/codea.png',
    faircoin: '/images/apps/faircoin.jpg',
    'faircoin-explorer': '/images/apps/faircoin-explorer.png',
    'faircoin-wallet': '/images/apps/faircoin-wallet.png',
    inbox: '/images/apps/inbox.png',
    mention: '/images/apps/mention.png',
    mercaria: '/images/apps/mercaria.png',
    oxyos: '/images/apps/oxyos.png',
    pay: '/images/apps/oxypay.png',
    tnp: '/images/apps/tnp.png',
  }

  // One insert, not one per icon: the ids come back in the order they were sent.
  const iconEntries = Object.entries(APP_ICONS)
  const iconRows = await db
    .insert(media)
    .values(
      iconEntries.map(([, path]) => ({
        url: path,
        filename: path.slice(path.lastIndexOf('/') + 1),
        key: path.slice(1),
        mimeType: MIME_BY_EXTENSION[path.slice(path.lastIndexOf('.'))] ?? 'image/png',
        size: 0, alt: '', tags: [], folder: 'apps',
        thumbnails: { sm: '', md: '', lg: '' },
      })),
    )
    .returning({ id: media._id })
  const appIconIds = new Map(iconEntries.map(([productId], i) => [productId, iconRows[i].id]))
  const appIcon = (productId: string) => appIconIds.get(productId) ?? null

  // ── Navigation (matches current production) ──
  // Manual dropdowns (Platform / Resources) still have hand-curated items.
  // Ecosystem is now a `kind: 'apps'` dropdown — resolved server-side from
  // Product.find({ showInNav: true }) grouped by Category slug.
  await db.insert(navigationDropdowns).values([
    {
      label: 'Platform',
      order: 0,
      // No apps here: they are generated into the Technologies dropdown from the
      // product records. This one is the layer underneath them.
      items: [
        { title: 'Oxy ID', description: 'The identity layer every app signs in with', href: '/developers/docs', icon: 'data', section: 'Platform' },
        { title: 'Oxy AI', description: 'Private models, API and SDKs', href: '/ai', icon: 'ai', section: 'Platform' },
        { title: 'Bloom', description: 'The design system behind every app', href: '/developers/docs/bloom/playground', image: appIcon('bloom'), section: 'Platform' },
        { title: 'Developer platform', description: 'Build on Oxy', href: '/developers/docs', icon: 'developers', section: 'Build' },
        { title: 'API reference', description: 'Every endpoint, versioned', href: '/developers/docs/api', icon: 'contract', section: 'Build' },
        { title: 'Status', description: 'Live health of every service', href: '/status', icon: 'network', section: 'Build' },
        { title: 'Open source', description: 'Read and run what we ship', href: 'https://github.com/OxyHQ', icon: 'github', section: 'Build' },
      ],
      sidePanel: {
        heading: 'Get started',
        links: [
          { label: 'Academy', href: '/academy' },
          { label: 'Help center', href: '/help' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Partner programs', href: '/partners' },
        ],
      },
    },
    {
      label: 'Resources',
      order: 1,
      items: [
        { title: 'Help center', description: "Learn more about Oxy's features", href: '/help', icon: 'help-center', section: 'Support' },
        { title: 'Academy', description: 'Essential Oxy features explained', href: '/academy', icon: 'academy', section: 'Support' },
        { title: 'FAQs', description: 'Short answers about Oxy', href: '/faqs', icon: 'help-center', section: 'Support' },
        { title: 'Developer docs', description: 'Start building Oxy apps', href: '/developers/docs', icon: 'developers', section: 'Developers' },
        { title: 'Partner programs', description: 'Developers, creators, consultants', href: '/partners', icon: 'partners', section: 'Partners' },
      ],
      sidePanel: {
        heading: 'Company',
        links: [
          { label: 'Newsroom', href: '/newsroom' },
          { label: 'Manifesto', href: '/company/manifesto' },
          { label: 'Founding Charter', href: '/company/charter' },
          { label: 'Changelog', href: '/changelog' },
          { label: 'Careers', href: '/company/careers' },
        ],
      },
    },
    {
      label: 'Technologies',
      // Items are generated at response time from products where showInNav=true,
      // grouped by their category slug. Nothing manual to keep in sync here.
      kind: 'apps',
      order: 2,
      items: [],
      sidePanel: {
        heading: 'Explore',
        links: [
          { label: 'All technologies', href: '/technologies' },
          { label: 'Open source', href: 'https://github.com/OxyHQ' },
          { label: 'Developer platform', href: '/developers/docs' },
          { label: 'Status page', href: '/status' },
        ],
      },
    },
  ])
  console.log('Seeded navigation')

  // ── Footer (exact copy) ──
  await db.insert(footers).values({
    columns: [
      {
        title: 'Platform',
        links: [
          { label: 'Technologies', href: '/technologies' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Changelog', href: '/changelog' },
          { label: 'Status', href: '/status' },
          { label: 'Referrals', href: '/referrals', isNewBadge: true },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '/company' },
          { label: 'Manifesto', href: '/company/manifesto' },
          { label: 'Founding Charter', href: '/company/charter' },
          { label: 'How Our Business Works', href: '/company/business' },
          { label: 'Transparency Center', href: '/company/transparency' },
          { label: 'The Initiative', href: '/initiative' },
          { label: 'Team', href: '/company/team' },
          { label: 'Careers', href: '/company/careers' },
          { label: 'Newsroom', href: '/newsroom' },
          { label: 'Engineering blog', href: '/company/news', isNewBadge: true },
          { label: 'Become a partner', href: '/partners' },
        ],
      },
      {
        title: 'Learn',
        links: [
          { label: 'Help center', href: '/help' },
          { label: 'Academy', href: '/academy' },
          { label: 'FAQs', href: '/faqs' },
          { label: 'Developer docs', href: '/developers/docs' },
          { label: 'API reference', href: '/developers/docs/api' },
          { label: 'Open source', href: 'https://github.com/OxyHQ', isExternal: true },
        ],
      },
      {
        title: 'Apps',
        links: [
          { label: 'Commons', href: '/commons' },
          { label: 'Accounts', href: 'https://accounts.oxy.so/', isExternal: true },
          { label: 'Mention', href: '/mention' },
          { label: 'Oxy Inbox', href: '/inbox' },
          { label: 'Allo', href: 'https://allo.oxy.so/', isExternal: true },
          { label: 'Alia', href: 'https://alia.onl/', isExternal: true },
          { label: 'Homiio', href: '/homiio' },
          { label: 'Syra', href: 'https://syra.fm', isExternal: true },
          { label: 'Mercaria', href: 'https://mercaria.co', isExternal: true },
          { label: 'Oxy Pay', href: '/pay' },
          { label: 'FairCoin', href: '/faircoin' },
          { label: 'Codea', href: '/codea' },
          { label: 'Astro', href: '/astro' },
          { label: 'TNP', href: '/tnp' },
          { label: 'Oxy OS', href: '/os' },
        ],
      },
    ],
    socialLinks: [
      { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/company/oxyhq/' },
      { label: 'X', icon: 'x', href: 'https://x.com/oxyhqinc' },
    ],
    copyright: 'Made with 💚 in the 🌎 by Oxy.',
  })
  console.log('Seeded footer')

  // ── Categories (shared grouping labels used by products + navbar + academy) ──
  const categoryDocs = await db.insert(categories).values([
    { slug: 'social-communication', label: 'Social & Communication', scope: 'apps', order: 0 },
    { slug: 'finance-commerce', label: 'Finance & Commerce', scope: 'apps', order: 1 },
    { slug: 'apps', label: 'Apps', scope: 'apps', order: 2 },
    { slug: 'infrastructure', label: 'Infrastructure', scope: 'apps', order: 3 },
    { slug: 'developer', label: 'Developer', scope: 'apps', order: 4 },
    { slug: 'fundamentals', label: 'Fundamentals', scope: 'generic', order: 0, description: 'Core concepts and first steps on the Oxy platform.' },
    { slug: 'advanced', label: 'Advanced', scope: 'generic', order: 1, description: 'Deep dives, production patterns and performance tuning.' },
    { slug: 'help-getting-started', label: 'Getting started', scope: 'generic', order: 10, description: 'Set up your account and find your way around Oxy.' },
    { slug: 'help-account', label: 'Account & profile', scope: 'generic', order: 11, description: 'Manage your account, preferences and identity.' },
    { slug: 'help-billing', label: 'Billing & plans', scope: 'generic', order: 12, description: 'Subscriptions, invoices and payment methods.' },
    { slug: 'help-developer', label: 'Developer & API', scope: 'generic', order: 13, description: 'Integrations, the Oxy API and self-serve tooling.' },
  ]).returning({ slug: categories.slug, id: categories._id })
  const categoryIdBySlug = new Map(categoryDocs.map((c) => [c.slug, c.id] as const))
  const categoryRef = (slug: string) => categoryIdBySlug.get(slug) ?? null
  console.log('Seeded categories')

  // ── Products (/technologies + /status + ecosystem navbar, single source of truth) ──
  // `category` is the ObjectId ref to a Category; `section` stays populated
  // with the matching slug for backwards compatibility / fallback grouping.
  await db.insert(products).values([
    { productId: 'alia', logo: appIcon('alia'), name: 'Alia AI', tagline: 'Intelligent assistant', description: 'Your private AI assistant on web, iOS and Android. Ask anything, get answers, automate work — without your data feeding a training set.', href: 'https://alia.onl/', landingUrl: '/alia', healthUrl: 'https://alia.onl/', external: true, cta: 'Open Alia', brand: '#7c3aed', mark: 'A', category: categoryRef('social-communication'), section: 'social-communication', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 0 },
    { productId: 'mention', logo: appIcon('mention'), name: 'Mention', tagline: 'Open social network', description: 'A social network built on respect. No engagement-maxxing algorithms, no surveillance ads — just genuine connection on the open fediverse. Your profile, your content, your unique link.', href: 'https://mention.earth/', landingUrl: '/mention', external: false, cta: 'Explore Mention', brand: '#0ea5e9', mark: 'M', category: categoryRef('social-communication'), section: 'social-communication', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 1 },
    { productId: 'inbox', logo: appIcon('inbox'), name: 'Oxy Inbox', tagline: 'Unified messaging', description: 'All your email, chat and federated messages in one calm place. Smart triage surfaces what matters, end-to-end encrypted by default.', href: 'https://inbox.oxy.so', landingUrl: '/inbox', external: false, cta: 'Explore Inbox', brand: '#1e40af', mark: 'I', category: categoryRef('social-communication'), section: 'social-communication', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 2 },
    { productId: 'faircoin', logo: appIcon('faircoin'), name: 'FairCoin', tagline: 'Currency that cares', description: 'Cryptocurrency built for sustainability, not speculation. Powering ethical commerce and local economies worldwide.', href: 'https://fairco.in/', external: true, cta: 'Visit FairCoin', brand: '#16a34a', mark: 'F', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 0 },
    { productId: 'faircoin-bridge', name: 'FairCoin Bridge', tagline: 'FairCoin on Base', description: 'Custodial 1:1 bridge between FairCoin L1 and WFAIR on Base, and the buy-FAIR flow behind it.', href: 'https://bridge.fairco.in', healthUrl: 'https://bridge.fairco.in/health', external: true, cta: 'Bridge status', brand: '#16a34a', mark: 'B', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 3 },
    { productId: 'faircoin-buy', name: 'FairCoin Buy', tagline: 'Buy FAIR with crypto', description: 'Payment-address allocation for buy orders. Separate from the bridge probe: buying can be down while deposits, mints and releases keep working.', href: 'https://buy.fairco.in', healthUrl: 'https://bridge.fairco.in/health/buy', external: true, cta: 'Buy FAIR', brand: '#16a34a', mark: 'B', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 4 },
    { productId: 'faircoin-wallet', logo: appIcon('faircoin-wallet'), name: 'FairCoin Wallet', tagline: 'Manage your FairCoin', description: 'Self-custodied wallet built for everyday FairCoin use — send, receive, and track balances across devices.', href: 'https://fairco.in/wallet', external: true, cta: 'Open wallet', brand: '#16a34a', mark: 'W', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: true, order: 1 },
    { productId: 'pay', logo: appIcon('pay'), name: 'Oxy Pay', tagline: 'Money that works harder', description: 'Earn yield, get cashback, send money instantly, and manage it all in one place — with the Oxy Pay Card wherever Visa is accepted.', href: '/pay', landingUrl: '/pay', external: false, cta: 'Explore Oxy Pay', brand: '#16a34a', mark: 'P', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: true, order: 3 },
    { productId: 'faircoin-explorer', logo: appIcon('faircoin-explorer'), name: 'FairCoin Explorer', tagline: 'Blockchain explorer', description: 'Browse blocks, transactions and addresses on the FairCoin network.', href: 'https://explorer.fairco.in', healthUrl: 'https://explorer.fairco.in/api/mining-info?network=mainnet', external: true, cta: 'Open explorer', brand: '#16a34a', mark: 'E', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 2 },
    { productId: 'homiio', name: 'Homiio', tagline: 'Rental made easy', description: 'Renting made fair: transparent listings, values-based roommate matching, an Oxy-powered trust score and Sindi, your AI tenant-rights assistant. Affordable housing made accessible through open technology.', href: 'https://homiio.com/', landingUrl: '/homiio', external: false, cta: 'Explore Homiio', brand: '#e11d48', mark: 'H', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 0 },
    { productId: 'clarity', logo: appIcon('clarity'), name: 'Clarity', tagline: 'AI answer engine', description: 'AI-powered answer engine that cites its sources and respects your privacy.', href: 'https://clarity.surf', external: true, cta: 'Open Clarity', brand: '#0ea5e9', mark: 'C', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 1 },
    { productId: 'codea', name: 'Codea', tagline: 'Open-source code editor', description: 'A professional AI code editor that runs in your browser, on your machine, or self-hosted. Write, review and ship — on your terms.', href: '/codea', landingUrl: '/codea', external: false, cta: 'Explore Codea', brand: '#0f172a', mark: 'C', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: true, order: 2 },
    { productId: 'oxyos', logo: appIcon('oxyos'), name: 'Oxy OS', tagline: 'Operating system', description: 'An operating system designed around privacy and user freedom. Your computer, your data — no telemetry, no tracking, no compromises.', href: 'https://os.oxy.so', landingUrl: '/os', external: false, cta: 'Explore Oxy OS', brand: '#f97316', mark: 'X', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 3 },
    { productId: 'oxy-ai', name: 'Oxy AI', tagline: 'Models, API and SDKs', description: 'Privacy-first AI for developers. Open models you can inspect, fine-tune and self-host — backed by a fast, multilingual API.', href: '/ai', external: false, cta: 'Explore Oxy AI', brand: '#dc2626', mark: 'O', category: categoryRef('developer'), section: 'developer', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: false, order: 0 },
    { productId: 'oxy-api', name: 'Oxy API', tagline: 'Core identity + platform API', description: 'The core API that powers sign-in, sessions and the Oxy ecosystem.', href: 'https://api.oxy.so', healthUrl: 'https://api.oxy.so/health', external: true, cta: 'API reference', brand: '#475569', mark: 'A', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 0 },
    { productId: 'website-api', name: 'Website API', tagline: 'Powers oxy.so content + MCP', description: 'Content API and MCP server for oxy.so.', href: 'https://website-api.oxy.so', healthUrl: 'https://website-api.oxy.so/api/health', external: true, cta: 'Status', brand: '#475569', mark: 'W', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 1 },
    { productId: 'accounts', logo: appIcon('accounts'), name: 'Accounts', tagline: 'Sign-in, profile, billing', description: 'Central hub for managing your Oxy identity, devices and billing.', href: 'https://accounts.oxy.so', external: true, cta: 'Open accounts', brand: '#475569', mark: 'A', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 2 },
    { productId: 'tnp', logo: appIcon('tnp'), name: 'TNP', tagline: 'Alternative namespace', description: 'The Network Protocol — register names on .ox, .app, .com and more. DNS-only, system-wide, and fully under your control.', href: '/tnp', landingUrl: '/tnp', external: false, cta: 'Explore TNP', brand: '#10b981', mark: 'T', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: true, order: 3 },
    { productId: 'astro', logo: appIcon('astro'), name: 'Astro', tagline: 'AI browser', description: 'Browse the web with AI by your side. Astro gives you instant answers, smarter suggestions and help with tasks — privacy you control.', href: '/astro', landingUrl: '/astro', external: false, cta: 'Explore Astro', brand: '#a855f7', mark: 'A', category: categoryRef('apps'), section: 'apps', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: true, order: 0 },
    { productId: 'codex-extension', name: 'Codex Extension', tagline: 'Codea, everywhere you code', description: 'Bring Codea\u2019s open-source AI assistant into the editor you already use. Reviews, refactors and completions — free to inspect, free to extend.', href: '/codea/extension', landingUrl: '/codea/extension', external: false, cta: 'Explore the extension', brand: '#475569', mark: 'E', category: categoryRef('developer'), section: 'developer', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: false, order: 1 },
    { productId: 'syra', name: 'Syra', tagline: 'Music, artists and live', description: 'A home for music: streaming built around artists, listeners and live experiences rather than the economics of a catalogue.', href: 'https://syra.fm', healthUrl: 'https://api.syra.fm', external: true, cta: 'Open Syra', brand: '#f43f5e', mark: 'S', category: categoryRef('apps'), section: 'apps', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: true, order: 4 },
    { productId: 'mercaria', logo: appIcon('mercaria'), name: 'Mercaria', tagline: 'Buy and sell, fairly', description: 'A marketplace for new goods from shops and secondhand items from people, with the same identity and trust you already have across Oxy.', href: 'https://mercaria.co', external: true, cta: 'Open Mercaria', brand: '#f59e0b', mark: 'M', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: true, order: 5 },
    { productId: 'crowdsource', name: 'CrowdSource', tagline: 'Participatory moderation', description: 'Reports become cases, cases are judged by an independent jury drawn at random, and the versioned decision goes back to the app. Nobody can pick the case they review.', href: '/company/charter#6-governance-designed-for-fallible-people', external: false, cta: 'How it works', brand: '#6366f1', mark: 'C', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: false, order: 4 },
  ])
  console.log('Seeded products')

  // ── Hero (homepage hero singleton) ──
  await db.insert(heroContents).values({
    title: DEFAULT_HERO_TITLE,
    backgroundVideoWebm: DEFAULT_HERO_BG_WEBM,
    backgroundVideoMp4: DEFAULT_HERO_BG_MP4,
    backgroundPoster: DEFAULT_HERO_POSTER,
    carouselSlots: DEFAULT_CAROUSEL_SLOTS as unknown as Record<string, unknown>[],
  })
  console.log('Seeded hero')

  // ── Testimonials ──
  // Intentionally empty. The five that used to live here were invented quotes
  // attributed to named people at real companies, which is not something the
  // site can carry. Add real ones through /admin/testimonials once they exist.
  console.log('Seeded testimonials (none)')

  // ── Pricing (exact copy) ──
  await db.insert(pricingPlans).values([
    { name: 'Free', price: { monthly: 0, annual: 0 }, description: '500 credits per seat / month', features: ['500 credits per seat / month'], cta: 'Get started', ctaHref: 'https://accounts.oxy.so/', highlighted: false, order: 0 },
    { name: 'Pro', price: { monthly: 0, annual: 0 }, description: '1,000 credits per seat / month', features: ['1,000 credits per seat / month'], cta: 'Get started', ctaHref: 'https://accounts.oxy.so/', highlighted: true, order: 1 },
    { name: 'Enterprise', price: { monthly: 0, annual: 0 }, description: '2,500 credits per seat / month', features: ['2,500 credits per seat / month'], cta: 'Contact sales', ctaHref: '/help', highlighted: false, order: 2 },
  ])
  console.log('Seeded pricing')

  // ── Site Settings ──
  const ogMediaId = await seedMedia('https://oxy.so/og-default.png', 'og-default.png', 'image/png')
  await db.insert(siteSettings).values({
    siteTitle: 'Oxy — Open technology that answers to the people who use it',
    siteDescription:
      'An open ecosystem of apps built on one identity you hold yourself: social, messaging, housing, payments and AI. No surveillance advertising, no data sales, source you can read.',
    ogImage: ogMediaId,
    banner: { text: 'Read the Oxy Founding Charter', href: '/company/charter', visible: true },
  })
  console.log('Seeded site settings')

  // ── Pages ──
  await db.insert(pages).values({
    slug: 'ai',
    title: 'Oxy AI — Understand Your World',
    description: 'Intelligent AI that understands your workflow, your data, and your goals. Chat, API, and developer tools built for everyone.',
    sections: [],
    promptPhrases: [
      'Summarize the latest research on climate change mitigation...',
      'What are the key findings in CRISPR gene therapy?',
      'Explain how transformer models work in simple terms...',
      'Find recent papers on drug discovery using AI...',
      'What are the breakthroughs in quantum computing this year?',
      'How is AI being used in genomics research?',
      'Analyze the trends in renewable energy adoption...',
      'What do we know about neuroplasticity and learning?',
    ],
  })
  console.log('Seeded pages')

  // ── Team Members ──
    await db.insert(teamMembers).values([
    { name: 'Ton Soteras', slug: 'ton', role: 'Public Relations Officer', department: 'Communications', bio: 'Responsible for talking, discussing, negotiating, and recruiting people who are interested in Oxy and FairCoin.', order: 1 },
    { name: 'Juan C. Moslares Fusté', slug: 'juan-c-moslares-fuste', role: 'Chief Communications Officer (CCO)', department: 'Communications', bio: 'Juan leads communication at Oxy, connecting our vision with the world through his experience in radio.', order: 2 },
    { name: 'Alejandra Sanchez Garcia', slug: 'alejandrasanchez', role: 'Frontend Developer', department: 'Engineering', bio: 'Alejandra focuses on designing and developing user-friendly interfaces that align with Oxy\'s vision. By applying modern web technologies and best practices, she helps create seamless and impactful digital experiences.', order: 3 },
    { name: 'Desirée Moreno Corpas', slug: 'desiree', role: 'Full-Stack Web Developer', department: 'Engineering', bio: 'Desirée is a Full-Stack Web Developer with expertise in JavaScript, PHP, React, and Agile methodologies. After transitioning from a career in the performing arts, she now focuses on creating scalable, user-centered web applications.', order: 4 },
  ])
  console.log('Seeded team members')

  // ── Changelog (sample) ──
  await db.insert(changelogEntries).values([
    { title: 'Device-first sessions everywhere', content: 'Signing in to any Oxy app now proves possession of a credential held on your device.', tags: ['identity', 'release'], date: new Date('2026-07-18'), items: ['No session cookie', 'Per-device credentials', 'Faster cold start'] },
    { title: 'Founding Charter published', content: 'The commitments Oxy intends to be held to are now public.', tags: ['company'], date: new Date('2026-08-01'), items: ['Charter at /company/charter', 'Linked from the manifesto', 'Open to challenge'] },
  ])
  console.log('Seeded changelog')

  // ── Tracked Repos (sample) ──
  await db.insert(trackedRepos).values([
    {
      owner: 'vercel',
      repo: 'next.js',
      displayName: 'Next.js',
      defaultTags: [{ label: 'Framework', color: 'rgb(38, 109, 240)' }],
      active: true,
    },
  ])
  console.log('Seeded tracked repos')

  // ── Jobs (sample) ──
  await db.insert(jobs).values([
    {
      title: 'Senior Frontend Engineer',
      slug: 'senior-frontend-engineer-remote',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      compensation: '$140K – $180K',
      subtitle: 'Build the next generation of Oxy products.',
      description: [
        { type: 'heading', text: 'About the role' },
        { type: 'paragraph', text: 'We are looking for a Senior Frontend Engineer to help build and scale the Oxy platform. You will work closely with design and product to ship polished, performant interfaces used by millions of people worldwide.' },
        { type: 'heading', text: 'What you will do' },
        { type: 'list', items: [
          'Architect and implement core UI components using React and TypeScript',
          'Drive frontend performance improvements across the platform',
          'Collaborate with designers to translate Figma specs into pixel-perfect interfaces',
          'Mentor junior engineers and contribute to engineering standards',
          'Participate in code reviews and architectural design discussions',
        ] },
        { type: 'heading', text: 'What we look for' },
        { type: 'list', items: [
          '5+ years of professional frontend development experience',
          'Deep expertise in React, TypeScript, and modern CSS',
          'Experience with state management, SSR, and performance optimization',
          'Strong understanding of web accessibility (WCAG 2.1 AA)',
          'Excellent written and verbal communication skills',
        ] },
      ],
      active: true,
    },
    {
      title: 'AI/ML Engineer',
      slug: 'ai-ml-engineer-remote',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      compensation: '$160K – $210K',
      subtitle: 'Work on Alia and the AI infrastructure behind it.',
      description: [
        { type: 'heading', text: 'About the role' },
        { type: 'paragraph', text: 'Join the team building Alia, the assistant that runs across the Oxy ecosystem. You will design and deploy models that help people get real work done, without their data feeding somebody else\u2019s training set.' },
        { type: 'heading', text: 'What you will do' },
        { type: 'list', items: [
          'Design and train ML models for natural language understanding and entity extraction',
          'Build retrieval-augmented generation (RAG) pipelines over user-controlled data',
          'Optimize inference latency and cost across production workloads',
          'Develop evaluation frameworks for model quality and safety',
          'Collaborate with product engineers to integrate AI features end-to-end',
        ] },
        { type: 'heading', text: 'What we look for' },
        { type: 'list', items: [
          '3+ years of experience in applied ML or NLP',
          'Proficiency in Python, PyTorch or JAX, and transformer architectures',
          'Experience with LLM fine-tuning, prompt engineering, and RAG systems',
          'Familiarity with ML infrastructure (model serving, monitoring, A/B testing)',
          'Publication track record or equivalent industry experience is a plus',
        ] },
      ],
      active: true,
    },
    {
      title: 'Product Designer',
      slug: 'product-designer-remote',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      compensation: '$120K – $155K',
      subtitle: 'Design beautiful, accessible experiences.',
      description: [
        { type: 'heading', text: 'About the role' },
        { type: 'paragraph', text: 'We are hiring a Product Designer to shape the future of the Oxy experience. You will own end-to-end design for key product surfaces, from discovery research through high-fidelity prototyping and production handoff.' },
        { type: 'heading', text: 'What you will do' },
        { type: 'list', items: [
          'Lead design for one or more product areas across web and mobile',
          'Conduct user research, usability testing, and competitive analysis',
          'Create wireframes, interaction flows, and high-fidelity Figma prototypes',
          'Contribute to and evolve the Oxy design system',
          'Partner with engineering to ensure design intent is preserved in production',
        ] },
        { type: 'heading', text: 'What we look for' },
        { type: 'list', items: [
          '4+ years of product design experience at a technology company',
          'Strong portfolio demonstrating systems thinking and attention to detail',
          'Proficiency in Figma and modern prototyping tools',
          'Experience designing for complex data-rich applications',
          'Passion for accessibility and inclusive design practices',
        ] },
      ],
      active: true,
    },
  ])
  console.log('Seeded jobs')

  // ── Newsroom Posts (sample) ──
  const newsroomImages = await Promise.all([
    seedMedia('https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop', 'ask-oxy-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop', 'sub-100ms-search-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop', 'responsible-ai-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1553729459-ade9a7b3b02e?w=1200&h=630&fit=crop', 'series-b-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=630&fit=crop', 'llm-reasoning-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1563986768609-322da13575f2?w=1200&h=630&fit=crop', 'soc2-certification-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop', 'workflow-automations-v2-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=630&fit=crop', 'g2-leader-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop', 'data-migration-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop', 'prompt-injection-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=630&fit=crop', 'homiio-rental-tips-cover.jpg'),
  ])

  // Seed posts describe work that actually exists in the ecosystem. The set
  // this replaced claimed a $50M Series B led by a named investor, a G2 award
  // and a SOC 2 Type II certification, none of which had happened.
  await db.insert(newsroomPosts).values([
    {
      title: 'The Oxy Founding Charter',
      slug: 'the-oxy-founding-charter',
      resume: 'What Oxy is trying to become, what it must protect while it grows, and the commitments that are not for sale.',
      description: 'The founding charter sets out the commitments Oxy intends to be held to as it grows.',
      content: '<p>We have published the Oxy Founding Charter: a moral constitution for the work ahead. It states what Oxy is, how it can earn money without making people the product, why capital may support the mission but never own it, and which commitments should be hardest to change.</p><p>The charter is a founding draft rather than a finished institution. Its purpose is to make the direction clear enough that people can decide whether to trust it, join it and hold it accountable.</p>',
      coverImage: newsroomImages[0],
      imageAlt: 'Abstract composition in Oxy colours',
      tags: ['company', 'governance'],
      categories: ['Company'],
      featured: true,
      status: 'published',
      publishedAt: new Date('2026-08-01'),
    },
    {
      title: 'Device-first identity: how signing in to Oxy works',
      slug: 'device-first-identity-how-signing-in-works',
      resume: 'Your device holds the secret that proves who you are, so a breach of our infrastructure is not a breach of your identity.',
      description: 'An explanation of the device-first session model behind Oxy ID.',
      content: '<p>Signing in across Oxy no longer depends on a session cookie. Each device keeps its own credential and mints a short-lived access token by proving possession of it. There is no shared cookie to steal and nothing on our side that can impersonate you.</p><p>The trade-off is real: self custody puts the responsibility for recovery closer to the person holding the key, which is why recovery gets the engineering attention it does.</p>',
      coverImage: newsroomImages[1],
      imageAlt: 'Close-up of a phone being unlocked',
      tags: ['engineering', 'identity', 'privacy'],
      categories: ['Engineering'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-07-18'),
    },
    {
      title: 'Mention is federated: your posts travel beyond us',
      slug: 'mention-is-federated',
      resume: 'Mention speaks ActivityPub, so people on other servers running other software are first class participants.',
      description: 'Why Mention federates through ActivityPub instead of building a walled garden.',
      content: '<p>Mention connects to the wider social web through ActivityPub. Someone on a different server, running different software, operated by people we have never met, can follow you and reply to you without an account on anything we run.</p><p>By conventional measures federation is worse for us. It caps network effects and complicates moderation. We do it because a walled garden is the structure that makes every later abuse possible.</p>',
      coverImage: newsroomImages[2],
      imageAlt: 'Network of connected points',
      tags: ['product', 'fediverse'],
      categories: ['Product'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-06-30'),
    },
    {
      title: 'A shared design system across every Oxy app',
      slug: 'a-shared-design-system-across-every-oxy-app',
      resume: 'Bloom is the component library behind the apps, on web and on mobile, so a fix in one place lands everywhere.',
      description: 'How the shared UI library keeps the ecosystem consistent.',
      content: '<p>Every Oxy app renders the same components from one open library. Theming, accessibility and layout work done once reaches the whole ecosystem, and a bug fixed in the library is fixed in every app that consumes it.</p>',
      coverImage: newsroomImages[6],
      imageAlt: 'Grid of interface components',
      tags: ['engineering', 'design'],
      categories: ['Engineering'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-06-12'),
    },
    {
      title: 'FairCoin bridge and buy flow are now on the status page',
      slug: 'faircoin-bridge-and-buy-on-status',
      resume: 'The bridge and the buy flow are probed separately, because buying can be down while deposits and releases keep working.',
      description: 'Status coverage for the FairCoin bridge and the buy flow.',
      content: '<p>The FairCoin bridge and the buy flow now report to the public status page as separate services. They fail independently, so reporting them as one number hid outages that mattered to people mid-transaction.</p>',
      coverImage: newsroomImages[8],
      imageAlt: 'Bridge at dusk',
      tags: ['faircoin', 'infrastructure'],
      categories: ['Product'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-05-22'),
    },
    {
      title: 'Renting without the guesswork: what Homiio publishes',
      slug: 'renting-without-the-guesswork',
      resume: 'Transparent listings, values-based matching and an assistant that knows tenant rights.',
      description: 'How Homiio approaches transparency in rental listings.',
      content: '<p>Homiio publishes what tenants actually need in order to decide: the real cost, the real terms and a trust signal that can be inspected. Sindi, the tenant-rights assistant, answers questions about the rules that apply where you live.</p>',
      coverImage: newsroomImages[10],
      imageAlt: 'Apartment interior with natural light',
      tags: ['homiio', 'product'],
      categories: ['Product'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-05-06'),
    },
  ])
  console.log('Seeded newsroom posts')

  // ── Academy: Courses ──
  const academyCoverImages = await Promise.all([
    seedMedia('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop', 'academy-fundamentals-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=630&fit=crop', 'academy-ai-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop', 'academy-federation-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=630&fit=crop', 'academy-production-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop', 'academy-guide-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=630&fit=crop', 'academy-paper-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=630&fit=crop', 'academy-video-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop', 'academy-tool-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=630&fit=crop', 'academy-template-cover.jpg'),
    seedMedia('https://images.unsplash.com/photo-1554200876-56c2f25224fa?w=1200&h=630&fit=crop', 'academy-link-cover.jpg'),
  ])

  await db.insert(courses).values([
    {
      slug: 'oxy-fundamentals',
      title: 'Oxy Fundamentals',
      summary: 'A hands-on tour of the Oxy platform — identity, data, automations, and how the pieces fit together.',
      description: 'In this course you will set up an Oxy workspace, connect your first integrations, and learn how the shared platform primitives power every product in the ecosystem. By the end, you will have a working mental model of the stack and the confidence to ship your own flows.',
      coverImage: academyCoverImages[0],
      category: categoryRef('fundamentals'),
      level: 'beginner',
      durationMinutes: 90,
      featured: true,
      status: 'published',
      order: 0,
      tags: ['platform', 'getting-started'],
      lessons: [
        { title: 'Welcome to Oxy', slug: 'welcome', content: 'Meet the platform, the team behind it, and the principles that drive every decision we ship.', order: 0, durationMinutes: 8 },
        { title: 'Workspaces and identity', slug: 'workspaces', content: 'Create a workspace, invite your team, and set up single sign-on with the Oxy identity layer.', order: 1, durationMinutes: 12 },
        { title: 'Your first automation', slug: 'first-automation', content: 'Wire a trigger to an action and watch the platform respond in real time.', order: 2, durationMinutes: 18 },
      ],
      publishedAt: new Date('2026-02-20'),
    },
    {
      slug: 'building-with-oxy-ai',
      title: 'Building with Oxy AI',
      summary: 'Learn how to call the Oxy AI API, design prompts that actually ship, and ground responses in your own data.',
      description: 'Go beyond playground experiments. This course walks through using the Oxy AI API in production: prompt design, retrieval grounding, evaluation, and how to keep latency and cost in check.',
      coverImage: academyCoverImages[1],
      category: categoryRef('fundamentals'),
      level: 'intermediate',
      durationMinutes: 120,
      featured: true,
      status: 'published',
      order: 1,
      tags: ['ai', 'api', 'rag'],
      lessons: [
        { title: 'API basics', slug: 'api-basics', content: 'Authenticate, call the chat endpoint, and stream responses.', order: 0, durationMinutes: 15 },
        { title: 'Grounding with your data', slug: 'grounding', content: 'Combine retrieval, citations, and structured output to keep answers honest.', order: 1, durationMinutes: 25 },
        { title: 'Evaluating outputs', slug: 'evaluating', content: 'Ship a small eval harness so you can improve prompts with confidence.', order: 2, durationMinutes: 20 },
      ],
      publishedAt: new Date('2026-02-25'),
    },
    {
      slug: 'federated-messaging-with-mention',
      title: 'Federated messaging with Mention',
      summary: 'Publish, subscribe, and moderate across the open fediverse using Mention and the Oxy Inbox API.',
      description: 'Mention speaks ActivityPub, and so can your app. This advanced course covers the federation story end-to-end — delivery, signatures, moderation, and the pragmatic trade-offs we made along the way.',
      coverImage: academyCoverImages[2],
      category: categoryRef('advanced'),
      level: 'advanced',
      durationMinutes: 150,
      featured: true,
      status: 'published',
      order: 2,
      tags: ['fediverse', 'activitypub', 'messaging'],
      lessons: [
        { title: 'ActivityPub primer', slug: 'activitypub-primer', content: 'What the protocol actually guarantees, and where you still need to make product decisions.', order: 0, durationMinutes: 20 },
        { title: 'Signing and delivery', slug: 'signing-delivery', content: 'HTTP signatures, retries and inbox fan-out without falling off a cliff.', order: 1, durationMinutes: 30 },
        { title: 'Moderation at scale', slug: 'moderation', content: 'Block lists, reporting flows and the tooling we ship with Mention out of the box.', order: 2, durationMinutes: 25 },
      ],
      publishedAt: new Date('2026-03-02'),
    },
    {
      slug: 'production-ready-deploys',
      title: 'Production-ready deploys',
      summary: 'Take a demo from "it works on my machine" to "it serves a million users" with the Oxy deployment toolkit.',
      description: 'A practical course on shipping real workloads on Oxy infrastructure — observability, blue/green rollouts, incident response, and the rituals every team should adopt before launch day.',
      coverImage: academyCoverImages[3],
      category: categoryRef('advanced'),
      level: 'advanced',
      durationMinutes: 180,
      featured: false,
      status: 'published',
      order: 3,
      tags: ['production', 'ops', 'observability'],
      lessons: [
        { title: 'Instrumenting your service', slug: 'instrumenting', content: 'Traces, metrics and logs that actually tell you what broke.', order: 0, durationMinutes: 30 },
        { title: 'Rolling out without fear', slug: 'rollouts', content: 'Feature flags, canary pools and the rollback you hope to never press.', order: 1, durationMinutes: 30 },
        { title: 'Incident response', slug: 'incident-response', content: 'Runbooks, comms and the post-incident doc everyone actually reads.', order: 2, durationMinutes: 30 },
      ],
      publishedAt: new Date('2026-03-08'),
    },
  ])
  console.log('Seeded courses')

  // ── Academy: Resources ──
  await db.insert(resources).values([
    {
      slug: 'oxy-platform-overview-guide',
      title: 'The Oxy platform, in one page',
      summary: 'A fast-moving written tour of every surface in the Oxy ecosystem — what it does, when to use it, and where to dig deeper.',
      type: 'guide',
      coverImage: academyCoverImages[4],
      category: categoryRef('fundamentals'),
      href: '/academy/oxy-fundamentals',
      external: false,
      featured: true,
      status: 'published',
      order: 0,
      tags: ['platform', 'overview'],
      publishedAt: new Date('2026-02-22'),
    },
    {
      slug: 'grounded-answers-research-paper',
      title: 'Grounded answers: the Oxy AI research note',
      summary: 'The short paper behind Oxy AI — retrieval, ranking, and how we keep answers tethered to your data.',
      type: 'paper',
      coverImage: academyCoverImages[5],
      category: categoryRef('advanced'),
      href: 'https://oxy.so/og-default.png',
      external: true,
      featured: false,
      status: 'published',
      order: 1,
      tags: ['ai', 'research'],
      publishedAt: new Date('2026-02-27'),
    },
    {
      slug: 'mention-moderation-walkthrough-video',
      title: 'Mention moderation walkthrough',
      summary: 'A 14-minute screencast walking through the moderation console end-to-end.',
      type: 'video',
      coverImage: academyCoverImages[6],
      category: categoryRef('advanced'),
      href: 'https://mention.earth/',
      external: true,
      featured: false,
      status: 'published',
      order: 2,
      tags: ['fediverse', 'moderation', 'video'],
      publishedAt: new Date('2026-03-03'),
    },
    {
      slug: 'oxy-cli-tool',
      title: 'Oxy CLI',
      summary: 'A tiny command-line tool for shipping, debugging and observing Oxy apps without leaving your terminal.',
      type: 'tool',
      coverImage: academyCoverImages[7],
      category: categoryRef('fundamentals'),
      href: '/developers/docs',
      external: false,
      featured: true,
      status: 'published',
      order: 3,
      tags: ['cli', 'dev-tools'],
      publishedAt: new Date('2026-03-05'),
    },
    {
      slug: 'launch-readiness-template',
      title: 'Launch readiness template',
      summary: 'A copy-and-customize checklist every product team can run before cutting over to production.',
      type: 'template',
      coverImage: academyCoverImages[8],
      category: categoryRef('advanced'),
      href: '/developers/docs',
      external: false,
      featured: false,
      status: 'published',
      order: 4,
      tags: ['ops', 'launch'],
      publishedAt: new Date('2026-03-09'),
    },
    {
      slug: 'oxy-developer-docs',
      title: 'Oxy Developer Docs',
      summary: 'The canonical reference for every public API surface across the Oxy platform.',
      type: 'link',
      coverImage: academyCoverImages[9],
      category: categoryRef('fundamentals'),
      href: '/developers/docs',
      external: false,
      featured: false,
      status: 'published',
      order: 5,
      tags: ['docs', 'reference'],
      publishedAt: new Date('2026-03-11'),
    },
  ])
  console.log('Seeded academy resources')

  // ── Help Center: Page hero + popular searches ──
  await db.insert(pages).values({
    slug: 'help',
    title: 'Help Center',
    description: 'Find answers to common questions about Oxy, troubleshoot issues and get in touch with support.',
    sections: [
      {
        type: 'hero',
        heading: 'How can we help?',
        subheading: 'Get answers to common questions on all things Oxy',
        content: 'Help center',
        order: 0,
      },
      {
        type: 'getting-started',
        heading: 'Get started',
        subheading: 'with ',
        content: 'Oxy 101.',
        order: 1,
      },
      {
        type: 'getting-started-lead',
        content: 'Everything you need to master the basics of Oxy.',
        order: 2,
      },
      {
        type: 'popular-searches',
        items: [
          { key: 'importing', value: 'importing' },
          { key: 'billing', value: 'billing' },
          { key: 'integrations', value: 'integrations' },
        ],
        order: 3,
      },
    ],
    promptPhrases: [],
  })
  console.log('Seeded help page')

  // ── Help Center: Articles ──
  await db.insert(helpArticles).values([
    {
      slug: 'introduction-to-oxy',
      title: 'Introduction',
      summary: 'What Oxy is, who it is for and how the pieces fit together.',
      content: '## Welcome to Oxy\n\nOxy is an AI-first platform built around the people who use it. This article gives you the high-level tour — what makes Oxy different, who it is for and how the pieces fit together.\n\n- A privacy-first identity layer used across every Oxy product.\n- A unified data model that connects messaging, finance, infrastructure and AI.\n- An open ecosystem you can extend with your own apps and integrations.',
      category: categoryRef('help-getting-started'),
      icon: 'rocket',
      tags: ['intro', 'overview'],
      featured: true,
      status: 'published',
      order: 0,
      publishedAt: new Date('2026-03-01'),
    },
    {
      slug: 'navigating-oxy',
      title: 'Introduction to navigating Oxy',
      summary: 'Get to know your way around Oxy.',
      content: '## Navigating the workspace\n\nThe Oxy interface is designed to stay out of your way. This guide walks through the main surfaces you will use every day — the sidebar, command palette, account panel and search.',
      category: categoryRef('help-getting-started'),
      icon: 'compass',
      tags: ['ui', 'navigation'],
      featured: true,
      status: 'published',
      order: 1,
      publishedAt: new Date('2026-03-02'),
    },
    {
      slug: 'sync-email-and-calendar',
      title: 'Introduction to email sync',
      summary: 'Sync emails and calendar events in minutes.',
      content: '## Connect your inbox\n\nOxy can sync your existing email and calendar so the platform always has the latest context. This article covers the supported providers, OAuth flow, and how to manage permissions after you connect.',
      category: categoryRef('help-getting-started'),
      icon: 'mail',
      tags: ['email', 'integrations'],
      featured: true,
      status: 'published',
      order: 2,
      publishedAt: new Date('2026-03-03'),
    },
    {
      slug: 'manage-your-account',
      title: 'Managing your account',
      summary: 'Update your profile, change your password and manage devices.',
      content: '## Account settings\n\nVisit the account panel to update your profile photo, change your password, manage active devices and review your security log.',
      category: categoryRef('help-account'),
      icon: 'user',
      tags: ['account', 'profile'],
      featured: false,
      status: 'published',
      order: 3,
      publishedAt: new Date('2026-03-05'),
    },
    {
      slug: 'understanding-billing',
      title: 'Understanding billing',
      summary: 'Review invoices, change plans and update payment methods.',
      content: '## Billing\n\nThe billing section in your account shows every invoice, the plan you are on and your payment method. You can switch between monthly and annual billing at any time — pro-rated charges are applied automatically.',
      category: categoryRef('help-billing'),
      icon: 'credit-card',
      tags: ['billing', 'invoices'],
      featured: false,
      status: 'published',
      order: 4,
      publishedAt: new Date('2026-03-08'),
    },
    {
      slug: 'using-the-api',
      title: 'Using the Oxy API',
      summary: 'Authenticate, make your first request and explore the reference.',
      content: '## API basics\n\nThe Oxy API is REST-based with JSON request and response bodies. You authenticate with a personal access token and call any endpoint over HTTPS — see the [developer docs](/developers/docs) for the full reference.',
      category: categoryRef('help-developer'),
      icon: 'code',
      tags: ['api', 'developer'],
      featured: false,
      status: 'published',
      order: 5,
      publishedAt: new Date('2026-03-10'),
    },
  ])
  console.log('Seeded help articles')

  console.log('\nSeed complete! Every table reset with the original data.')
  await closeDatabase()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
