/**
 * Seed script — populates MongoDB with the original static content.
 * Always drops existing data first (full reset).
 *
 * Usage: bun run seed
 */
import mongoose from 'mongoose'
import { config } from './config.js'
import { Navigation } from './models/Navigation.js'
import { Footer } from './models/Footer.js'
import { Product } from './models/Product.js'
import { Category } from './models/Category.js'
import { HeroContent, DEFAULT_HERO_TITLE, DEFAULT_HERO_EYEBROW, DEFAULT_HERO_BG_WEBM, DEFAULT_HERO_BG_MP4, DEFAULT_HERO_POSTER, DEFAULT_CAROUSEL_SLOTS } from './models/HeroContent.js'
import { PricingPlan } from './models/PricingPlan.js'
import { Testimonial } from './models/Testimonial.js'
import { TeamMember } from './models/TeamMember.js'
import { ChangelogEntry } from './models/ChangelogEntry.js'
import { Job } from './models/Job.js'
import { SiteSettings } from './models/SiteSettings.js'
import { Page } from './models/Page.js'
import { NewsroomPost } from './models/NewsroomPost.js'
import { Course } from './models/Course.js'
import { Resource } from './models/Resource.js'
import { HelpArticle } from './models/HelpArticle.js'
import { Media } from './models/Media.js'
import TrackedRepo from './models/TrackedRepo.js'

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  // ── Drop all collections (full reset) ──
  const collections = [Navigation, Footer, HeroContent, Product, Category, PricingPlan, Testimonial, ChangelogEntry, Job, SiteSettings, Page, NewsroomPost, Course, Resource, HelpArticle, TrackedRepo, TeamMember, Media]
  await Promise.all(collections.map((m) => m.deleteMany({})))
  console.log('Cleared all collections')

  // ── Media helper: create a Media document from a URL ──
  async function seedMedia(url: string, filename: string, mimeType = 'image/jpeg'): Promise<typeof import('mongoose').Types.ObjectId> {
    const doc = await Media.create({
      url, filename, key: new URL(url).pathname.slice(1) || filename,
      mimeType, size: 0, alt: '', tags: [], folder: 'seed',
      thumbnails: { sm: '', md: '', lg: '' },
    })
    return doc._id
  }

  // ── Navigation (matches current production) ──
  // Manual dropdowns (Platform / Resources) still have hand-curated items.
  // Ecosystem is now a `kind: 'apps'` dropdown — resolved server-side from
  // Product.find({ showInNav: true }) grouped by Category slug.
  const CDN = 'https://oxy-bucket.ams3.cdn.digitaloceanspaces.com/oxy-website'
  const servicesMedia = await seedMedia(`${CDN}/navigation/services-b126fbf2.png`, 'services.png', 'image/png')

  await Navigation.insertMany([
    {
      label: 'Platform',
      order: 0,
      items: [
        { title: 'AI', description: 'Native to your platform', href: '/ai', icon: 'ai', section: 'Platform' },
        { title: 'Data model', description: 'Sync and enrich your data', href: '#', icon: 'data', section: 'Platform' },
        { title: 'Productivity & collaboration', description: 'Context for your team operations', href: '#', icon: 'collaboration', section: 'Platform' },
        { title: 'Services', description: 'Managed Oxy services', href: '/', image: servicesMedia, section: 'Platform' },
        { title: 'Workflows', description: 'Automate any process', href: '#', icon: 'automations', section: 'Automations' },
        { title: 'Sequences', description: 'Personalized outreach', href: '#', icon: 'sequences', section: 'Automations' },
        { title: 'Call Intelligence', description: 'Record and analyze meetings', href: '#', icon: 'call-intelligence', section: 'Insights' },
        { title: 'Reporting', description: 'Insights in real time', href: '#', icon: 'reporting', section: 'Insights' },
        { title: 'Developer Platform', description: 'Build on Oxy', href: '/developers/docs', icon: 'developers', section: 'Ecosystem' },
        { title: 'Apps', description: 'Extend with integrations', href: '/apps', icon: 'apps', section: 'Ecosystem' },
      ],
      sidePanel: {
        heading: 'Get started',
        links: [
          { label: 'Oxy 101', href: '#' },
          { label: 'Hire an expert', href: '#' },
          { label: 'Startup program', href: '/partners' },
          { label: 'Talk to sales', href: '/help' },
        ],
      },
    },
    {
      label: 'Resources',
      order: 1,
      items: [
        { title: 'Help center', description: "Learn more about Oxy's features", href: '/help', icon: 'help-center', section: 'Support' },
        { title: 'Academy', description: 'Essential Oxy features explained', href: '/academy', icon: 'academy', section: 'Support' },
        { title: 'Developer docs', description: 'Start building Oxy apps', href: '/developers/docs', icon: 'developers', section: 'Developers' },
        { title: 'Partner programs', description: 'Developers, creators, consultants', href: '/partners', icon: 'partners', section: 'Partners' },
      ],
      sidePanel: {
        heading: 'Company',
        links: [
          { label: 'Changelog', href: '/changelog' },
          { label: 'Newsroom', href: '/newsroom' },
          { label: 'Engineering blog', href: '/company/news' },
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
  await Footer.create({
    columns: [
      {
        title: 'Platform',
        links: [
          { label: 'Refer a team', href: '#', isNewBadge: true },
          { label: 'Changelog', href: '/changelog' },
          { label: 'iOS app', href: '#', isExternal: true },
          { label: 'Android app', href: '#', isExternal: true },
          { label: 'Security', href: '#' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '#' },
          { label: 'How Our Business Works', href: '/company/business' },
          { label: 'Careers', href: '/company/careers' },
          { label: 'Investor Relations', href: '#' },
          { label: 'Transparency Center', href: '/company/transparency' },
          { label: 'Community Guidelines', href: '#' },
          { label: 'Manifesto', href: '/company/manifesto' },
          { label: 'Newsroom', href: '/newsroom' },
          { label: 'Engineering blog', href: '/company/news', isNewBadge: true },
          { label: 'Become a partner', href: '/partners' },
        ],
      },
      {
        title: 'Import from',
        links: [
          { label: 'Salesforce', href: '#' },
          { label: 'Hubspot', href: '#' },
          { label: 'Pipedrive', href: '#' },
          { label: 'Zoho', href: '#' },
          { label: 'Excel', href: '#' },
          { label: 'CSV', href: '#' },
        ],
      },
      {
        title: 'Oxy for',
        links: [
          { label: 'Startups', href: '#' },
          { label: 'Creators', href: '#' },
          { label: 'Nonprofits', href: '#' },
          { label: 'Freelancers', href: '#' },
          { label: 'Communities', href: '#' },
          { label: 'Education', href: '#' },
        ],
      },
      {
        title: 'Apps',
        links: [
          { label: 'Oxy OS', href: 'https://os.oxy.so' },
          { label: 'Accounts', href: 'https://accounts.oxy.so/' },
          { label: 'Marketplace', href: '#' },
          { label: 'Alia', href: 'https://alia.onl/' },
          { label: 'FAIRWallet', href: 'https://fairco.in/wallet' },
          { label: 'Allo', href: 'https://allo.oxy.so/' },
          { label: 'Oxy Pay', href: '#' },
          { label: 'Noted', href: '#' },
          { label: 'Mention', href: '/mention' },
          { label: 'Moovo', href: '#' },
          { label: 'Helpio', href: '#' },
          { label: 'Syra', href: 'https://syra.fm/' },
          { label: 'Homiio', href: '/homiio' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Startup program', href: '#' },
          { label: 'Help center', href: '/help' },
          { label: 'Automation templates', href: '#' },
          { label: 'Developers', href: '/developers/docs' },
          { label: 'System status', href: '#', isExternal: true },
          { label: 'Hire an expert', href: '#' },
          { label: 'Downloads', href: '#' },
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
  const categoryDocs = await Category.insertMany([
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
  ])
  const categoryIdBySlug = new Map(categoryDocs.map((c) => [c.slug, c._id] as const))
  const categoryRef = (slug: string) => categoryIdBySlug.get(slug) ?? null
  console.log('Seeded categories')

  // ── Products (/technologies + /status + ecosystem navbar, single source of truth) ──
  // `category` is the ObjectId ref to a Category; `section` stays populated
  // with the matching slug for backwards compatibility / fallback grouping.
  await Product.insertMany([
    { productId: 'alia', name: 'Alia AI', tagline: 'Intelligent assistant', description: 'Your private AI assistant on web, iOS and Android. Ask anything, get answers, automate work — without your data feeding a training set.', href: 'https://alia.onl/', landingUrl: '/alia', healthUrl: 'https://alia.onl/', external: true, cta: 'Open Alia', brand: '#7c3aed', mark: 'A', category: categoryRef('social-communication'), section: 'social-communication', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 0 },
    { productId: 'mention', name: 'Mention', tagline: 'Open social network', description: 'A social network built on respect. No engagement-maxxing algorithms, no surveillance ads — just genuine connection on the open fediverse. Your profile, your content, your unique link.', href: 'https://mention.earth/', landingUrl: '/mention', external: false, cta: 'Explore Mention', brand: '#0ea5e9', mark: 'M', category: categoryRef('social-communication'), section: 'social-communication', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 1 },
    { productId: 'inbox', name: 'Oxy Inbox', tagline: 'Unified messaging', description: 'All your email, chat and federated messages in one calm place. Smart triage surfaces what matters, end-to-end encrypted by default.', href: 'https://inbox.oxy.so', landingUrl: '/inbox', external: false, cta: 'Explore Inbox', brand: '#1e40af', mark: 'I', category: categoryRef('social-communication'), section: 'social-communication', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 2 },
    { productId: 'faircoin', name: 'FairCoin', tagline: 'Currency that cares', description: 'Cryptocurrency built for sustainability, not speculation. Powering ethical commerce and local economies worldwide.', href: 'https://fairco.in/', external: true, cta: 'Visit FairCoin', brand: '#16a34a', mark: 'F', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 0 },
    { productId: 'faircoin-wallet', name: 'FairCoin Wallet', tagline: 'Manage your FairCoin', description: 'Self-custodied wallet built for everyday FairCoin use — send, receive, and track balances across devices.', href: 'https://fairco.in/wallet', external: true, cta: 'Open wallet', brand: '#16a34a', mark: 'W', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: true, order: 1 },
    { productId: 'faircoin-explorer', name: 'FairCoin Explorer', tagline: 'Blockchain explorer', description: 'Browse blocks, transactions and addresses on the FairCoin network.', href: 'https://explorer.fairco.in', healthUrl: 'https://explorer.fairco.in/api/mining-info?network=mainnet', external: true, cta: 'Open explorer', brand: '#16a34a', mark: 'E', category: categoryRef('finance-commerce'), section: 'finance-commerce', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 2 },
    { productId: 'homiio', name: 'Homiio', tagline: 'Rental made easy', description: 'Renting made fair: transparent listings, values-based roommate matching, an Oxy-powered trust score and Sindi, your AI tenant-rights assistant. Affordable housing made accessible through open technology.', href: 'https://homiio.com/', landingUrl: '/homiio', external: false, cta: 'Explore Homiio', brand: '#e11d48', mark: 'H', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 0 },
    { productId: 'clarity', name: 'Clarity', tagline: 'AI answer engine', description: 'AI-powered answer engine that cites its sources and respects your privacy.', href: 'https://clarity.surf', external: true, cta: 'Open Clarity', brand: '#0ea5e9', mark: 'C', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 1 },
    { productId: 'codea', name: 'Codea', tagline: 'Open-source code editor', description: 'A professional AI code editor that runs in your browser, on your machine, or self-hosted. Write, review and ship — on your terms.', href: '/codea', landingUrl: '/codea', external: false, cta: 'Explore Codea', brand: '#0f172a', mark: 'C', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: true, order: 2 },
    { productId: 'oxyos', name: 'Oxy OS', tagline: 'Operating system', description: 'An operating system designed around privacy and user freedom. Your computer, your data — no telemetry, no tracking, no compromises.', href: 'https://os.oxy.so', landingUrl: '/os', external: false, cta: 'Explore Oxy OS', brand: '#f97316', mark: 'X', category: categoryRef('apps'), section: 'apps', lifecycle: 'live', showOnProducts: true, showOnStatus: true, showInNav: true, order: 3 },
    { productId: 'oxy-ai', name: 'Oxy AI', tagline: 'Models, API and SDKs', description: 'Privacy-first AI for developers. Open models you can inspect, fine-tune and self-host — backed by a fast, multilingual API.', href: '/ai', external: false, cta: 'Explore Oxy AI', brand: '#dc2626', mark: 'O', category: categoryRef('developer'), section: 'developer', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: false, order: 0 },
    { productId: 'oxy-api', name: 'Oxy API', tagline: 'Core identity + platform API', description: 'The core API that powers sign-in, sessions and the Oxy ecosystem.', href: 'https://api.oxy.so', healthUrl: 'https://api.oxy.so/health', external: true, cta: 'API reference', brand: '#475569', mark: 'A', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 0 },
    { productId: 'website-api', name: 'Website API', tagline: 'Powers oxy.so content + MCP', description: 'Content API and MCP server for oxy.so.', href: 'https://website-api.oxy.so', healthUrl: 'https://website-api.oxy.so/api/health', external: true, cta: 'Status', brand: '#475569', mark: 'W', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 1 },
    { productId: 'accounts', name: 'Accounts', tagline: 'Sign-in, profile, billing', description: 'Central hub for managing your Oxy identity, devices and billing.', href: 'https://accounts.oxy.so', external: true, cta: 'Open accounts', brand: '#475569', mark: 'A', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: false, showOnStatus: true, showInNav: false, order: 2 },
    { productId: 'tnp', name: 'TNP', tagline: 'Alternative namespace', description: 'The Network Protocol — register names on .ox, .app, .com and more. DNS-only, system-wide, and fully under your control.', href: '/tnp', landingUrl: '/tnp', external: false, cta: 'Explore TNP', brand: '#10b981', mark: 'T', category: categoryRef('infrastructure'), section: 'infrastructure', lifecycle: 'live', showOnProducts: true, showOnStatus: false, showInNav: true, order: 3 },
    { productId: 'astro', name: 'Astro', tagline: 'AI browser', description: 'Browse the web with AI by your side. Astro gives you instant answers, smarter suggestions and help with tasks — privacy you control.', href: '/astro', landingUrl: '/astro', external: false, cta: 'Explore Astro', brand: '#a855f7', mark: 'A', category: categoryRef('apps'), section: 'apps', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: true, order: 0 },
    { productId: 'codex-extension', name: 'Codex Extension', tagline: 'Codea, everywhere you code', description: 'Bring Codea\u2019s open-source AI assistant into the editor you already use. Reviews, refactors and completions — free to inspect, free to extend.', href: '/codea/extension', landingUrl: '/codea/extension', external: false, cta: 'Explore the extension', brand: '#475569', mark: 'E', category: categoryRef('developer'), section: 'developer', lifecycle: 'in-development', showOnProducts: true, showOnStatus: false, showInNav: false, order: 1 },
  ])
  console.log('Seeded products')

  // ── Hero (homepage hero singleton) ──
  await HeroContent.create({
    title: DEFAULT_HERO_TITLE,
    eyebrow: DEFAULT_HERO_EYEBROW,
    backgroundVideoWebm: DEFAULT_HERO_BG_WEBM,
    backgroundVideoMp4: DEFAULT_HERO_BG_MP4,
    backgroundPoster: DEFAULT_HERO_POSTER,
    carouselSlots: DEFAULT_CAROUSEL_SLOTS,
  })
  console.log('Seeded hero')

  // ── Testimonials (exact copy) ──
  await Testimonial.insertMany([
    { quote: 'Before every meeting, Ask Oxy centralizes, summarizes, and surfaces everything I need to know to give a great first impression or close the deal.', author: 'Sarah Chen', role: 'VP of Sales', company: 'Runway', order: 0 },
    { quote: "Oxy is the first CRM that feels truly modern. It's powerful, flexible, and fast to build with. There's nothing like it on the market.", author: 'Marcus Rodriguez', role: 'Head of Revenue', company: 'Vercel', order: 1 },
    { quote: "Oxy is now a permanent part of my Go-To-Market playbook. It's like Notion for Sales.", author: 'Emily Park', role: 'CEO', company: 'Beam', order: 2 },
    { quote: 'Ask Oxy has become an indispensable tool for our sales leadership team, giving us incredible execution power and speed to insight.', author: 'David Kim', role: 'CRO', company: 'Scale', order: 3 },
    { quote: 'As a fast growing startup, our GTM motion is constantly evolving. Ask Oxy has enabled us to answer important questions, fast.', author: 'Priya Sharma', role: 'Head of Ops', company: 'Ramp', order: 4 },
  ])
  console.log('Seeded testimonials')

  // ── Pricing (exact copy) ──
  await PricingPlan.insertMany([
    { name: 'Free', price: { monthly: 0, annual: 0 }, description: '500 credits per seat / month', features: ['500 credits per seat / month'], cta: 'Get started', ctaHref: '/signup', highlighted: false, order: 0 },
    { name: 'Pro', price: { monthly: 0, annual: 0 }, description: '1,000 credits per seat / month', features: ['1,000 credits per seat / month'], cta: 'Get started', ctaHref: '/signup', highlighted: true, order: 1 },
    { name: 'Enterprise', price: { monthly: 0, annual: 0 }, description: '2,500 credits per seat / month', features: ['2,500 credits per seat / month'], cta: 'Contact sales', ctaHref: '/contact', highlighted: false, order: 2 },
  ])
  console.log('Seeded pricing')

  // ── Site Settings ──
  const ogMediaId = await seedMedia('https://oxy.so/og-default.png', 'og-default.png', 'image/png')
  await SiteSettings.create({
    siteTitle: 'Oxy — The AI-Powered CRM for Go-To-Market Teams',
    siteDescription: 'Search, update, and create across your entire CRM just by asking. Oxy is the AI CRM with Universal Context that deeply understands your business.',
    ogImage: ogMediaId,
    banner: { text: 'Introducing Ask Oxy — AI-powered CRM intelligence', href: '#', visible: true },
  })
  console.log('Seeded site settings')

  // ── Pages ──
  await Page.create({
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
  await TeamMember.deleteMany({})
  await TeamMember.create([
    { name: 'Ton Soteras', slug: 'ton', role: 'Public Relations Officer', department: 'Communications', bio: 'Responsible for talking, discussing, negotiating, and recruiting people who are interested in Oxy and FairCoin.', order: 1 },
    { name: 'Juan C. Moslares Fusté', slug: 'juan-c-moslares-fuste', role: 'Chief Communications Officer (CCO)', department: 'Communications', bio: 'Juan leads communication at Oxy, connecting our vision with the world through his experience in radio.', order: 2 },
    { name: 'Alejandra Sanchez Garcia', slug: 'alejandrasanchez', role: 'Frontend Developer', department: 'Engineering', bio: 'Alejandra focuses on designing and developing user-friendly interfaces that align with Oxy\'s vision. By applying modern web technologies and best practices, she helps create seamless and impactful digital experiences.', order: 3 },
    { name: 'Desirée Moreno Corpas', slug: 'desiree', role: 'Full-Stack Web Developer', department: 'Engineering', bio: 'Desirée is a Full-Stack Web Developer with expertise in JavaScript, PHP, React, and Agile methodologies. After transitioning from a career in the performing arts, she now focuses on creating scalable, user-centered web applications.', order: 4 },
  ])
  console.log('Seeded team members')

  // ── Changelog (sample) ──
  await ChangelogEntry.insertMany([
    { title: 'Ask Oxy public beta', content: 'Ask Oxy is now available to all workspaces.', tags: ['ai', 'beta'], date: new Date('2026-03-20'), items: ['Natural language CRM queries', 'Meeting intelligence', 'Call recording & analysis'] },
    { title: 'Workflow automations v2', content: 'Major update to the workflow engine.', tags: ['automations', 'release'], date: new Date('2026-03-10'), items: ['Conditional branching', 'Multi-step sequences', 'Webhook triggers'] },
  ])
  console.log('Seeded changelog')

  // ── Tracked Repos (sample) ──
  await TrackedRepo.create([
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
  await Job.insertMany([
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
      subtitle: 'Work on Ask Oxy and our AI infrastructure.',
      description: [
        { type: 'heading', text: 'About the role' },
        { type: 'paragraph', text: 'Join the AI team building Ask Oxy, our AI-powered CRM intelligence engine. You will design and deploy machine learning models that help sales teams close deals faster by surfacing the right information at the right time.' },
        { type: 'heading', text: 'What you will do' },
        { type: 'list', items: [
          'Design and train ML models for natural language understanding and entity extraction',
          'Build retrieval-augmented generation (RAG) pipelines for CRM data',
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
  ])

  await NewsroomPost.insertMany([
    {
      title: 'Introducing Ask Oxy: AI-Powered CRM Intelligence',
      slug: 'introducing-ask-oxy-ai-powered-crm-intelligence',
      resume: 'Ask Oxy is our new AI engine that lets you search, update, and create across your entire CRM using natural language.',
      description: 'A deep dive into the technology behind Ask Oxy and how it transforms the way sales teams interact with their CRM.',
      content: '<p>Today we are launching Ask Oxy, a new AI-powered interface that fundamentally changes how you interact with your CRM. Instead of clicking through menus and filters, you simply ask.</p><p>Ask Oxy understands context from your emails, meetings, and deal history to surface exactly what you need — before you even know you need it.</p>',
      coverImage: newsroomImages[0],
      imageAlt: 'Abstract AI visualization',

      tags: ['ai', 'product-launch', 'crm'],
      categories: ['Product'],
      featured: true,
      status: 'published',
      publishedAt: new Date('2026-03-20'),
    },
    {
      title: 'How Oxy Built a Sub-100ms Search Engine for CRM Data',
      slug: 'how-oxy-built-sub-100ms-search-engine-crm-data',
      resume: 'A technical deep dive into the architecture behind our real-time CRM search, from indexing strategies to query optimization.',
      description: 'Engineering blog post about building a fast search engine for CRM data.',
      content: '<p>When your CRM holds millions of records across contacts, deals, emails, and calls, search latency matters. In this post we share how we built our search pipeline to consistently return results in under 100 milliseconds.</p>',
      coverImage: newsroomImages[1],
      imageAlt: 'Server room with blue lighting',

      tags: ['engineering', 'performance', 'search'],
      categories: ['Engineering'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-03-15'),
    },
    {
      title: 'Our Approach to Responsible AI in Sales Technology',
      slug: 'our-approach-to-responsible-ai-in-sales-technology',
      resume: 'Oxy is committed to building AI that is transparent, fair, and aligned with user intent. Here is how we do it.',
      description: 'An overview of the safety measures and ethical frameworks guiding AI development at Oxy.',
      content: '<p>As AI becomes central to how businesses operate, we believe companies building AI products have a responsibility to ensure those systems are safe, fair, and transparent. This post outlines the principles and practices that guide AI development at Oxy.</p>',
      coverImage: newsroomImages[2],
      imageAlt: 'Human and AI collaboration concept',

      tags: ['ai', 'ethics', 'safety'],
      categories: ['Safety'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-03-10'),
    },
    {
      title: 'Oxy Raises $50M Series B to Accelerate AI-First CRM',
      slug: 'oxy-raises-50m-series-b-accelerate-ai-first-crm',
      resume: 'We are thrilled to announce our Series B funding round, led by Sequoia Capital, to expand our team and product.',
      description: 'Company announcement about the Series B funding round.',
      content: '<p>Today we are announcing a $50M Series B round led by Sequoia Capital with participation from existing investors. This funding will accelerate our mission to make CRM intelligent, intuitive, and accessible to every go-to-market team.</p>',
      coverImage: newsroomImages[3],
      imageAlt: 'Team celebration in modern office',

      tags: ['funding', 'company-news'],
      categories: ['Company'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-02-28'),
    },
    {
      title: 'Advancing LLM Reasoning for Structured CRM Queries',
      slug: 'advancing-llm-reasoning-structured-crm-queries',
      resume: 'New research from the Oxy AI team on improving large language model accuracy when translating natural language into database queries.',
      description: 'Research paper summary on LLM query translation for CRM systems.',
      content: '<p>One of the hardest problems in applying LLMs to enterprise software is translating ambiguous natural language into precise, structured queries. In this post we present our findings on constrained decoding techniques that improve query accuracy by 34%.</p>',
      coverImage: newsroomImages[4],
      imageAlt: 'Mathematical formulas on a whiteboard',

      tags: ['ai', 'research', 'llm'],
      categories: ['Research'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-02-20'),
    },
    {
      title: 'SOC 2 Type II Certification: What It Means for Our Customers',
      slug: 'soc-2-type-ii-certification-what-it-means',
      resume: 'Oxy has achieved SOC 2 Type II compliance, reinforcing our commitment to enterprise-grade data security.',
      description: 'Security announcement about SOC 2 Type II certification.',
      content: '<p>Security is foundational to everything we build. We are proud to announce that Oxy has successfully completed a SOC 2 Type II audit, independently verifying our controls for data security, availability, and confidentiality.</p>',
      coverImage: newsroomImages[5],
      imageAlt: 'Security shield and lock concept',

      tags: ['security', 'compliance', 'enterprise'],
      categories: ['Security'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-02-10'),
    },
    {
      title: 'Workflow Automations v2: Conditional Branching and Webhooks',
      slug: 'workflow-automations-v2-conditional-branching-webhooks',
      resume: 'Our biggest workflow update yet brings conditional logic, multi-step sequences, and webhook triggers to every workspace.',
      description: 'Product update announcing Workflow Automations v2.',
      content: '<p>Workflow Automations v2 is here. This release introduces conditional branching, enabling you to build sophisticated automation trees that respond to real-time signals from your pipeline. Combined with webhook triggers and multi-step sequences, your team can automate virtually any repeatable process.</p>',
      coverImage: newsroomImages[6],
      imageAlt: 'Dashboard with workflow automation interface',

      tags: ['automations', 'product-update'],
      categories: ['Product'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-02-01'),
    },
    {
      title: 'Oxy Named a Leader in G2 Spring 2026 CRM Report',
      slug: 'oxy-named-leader-g2-spring-2026-crm-report',
      resume: 'G2 has recognized Oxy as a Leader in the CRM category based on high customer satisfaction and market presence.',
      description: 'Company announcement about the G2 Spring 2026 recognition.',
      content: '<p>We are honored to be recognized as a Leader in the G2 Spring 2026 Grid Report for CRM. This recognition reflects the trust our customers place in Oxy and the hard work of our entire team to deliver a product people love.</p>',
      coverImage: newsroomImages[7],
      imageAlt: 'Award trophy on a modern desk',

      tags: ['awards', 'company-news'],
      categories: ['Company'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-01-25'),
    },
    {
      title: 'Migrating 2TB of CRM Data to a New Storage Layer Without Downtime',
      slug: 'migrating-2tb-crm-data-new-storage-layer-zero-downtime',
      resume: 'How the Oxy infrastructure team executed a zero-downtime migration of our primary datastore while serving production traffic.',
      description: 'Engineering post about a large-scale data migration.',
      content: '<p>Last quarter, we migrated our primary CRM datastore — over 2TB of live customer data — to a new storage layer without a single second of downtime. This post walks through the dual-write strategy, verification pipeline, and cutover process that made it possible.</p>',
      coverImage: newsroomImages[8],
      imageAlt: 'Data center infrastructure',

      tags: ['engineering', 'infrastructure', 'migration'],
      categories: ['Engineering'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-01-15'),
    },
    {
      title: 'Detecting and Preventing Prompt Injection in Enterprise AI',
      slug: 'detecting-preventing-prompt-injection-enterprise-ai',
      resume: 'A look at the multi-layered defenses Oxy uses to protect AI features from prompt injection and adversarial inputs.',
      description: 'Research and security post on prompt injection defense.',
      content: '<p>As AI features become core to enterprise products, prompt injection attacks present a real security risk. In this post we detail the multi-layered defense strategy Oxy employs — from input sanitization and output validation to adversarial testing and monitoring — to keep our customers safe.</p>',
      coverImage: newsroomImages[9],
      imageAlt: 'Cybersecurity concept with digital shield',

      tags: ['security', 'ai', 'research'],
      categories: ['Research'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-01-08'),
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

  await Course.insertMany([
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
        { title: 'Your first automation', slug: 'first-automation', content: 'Wire a trigger to an action and watch the CRM respond in real time.', order: 2, durationMinutes: 18 },
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
  await Resource.insertMany([
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
  await Page.create({
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
  await HelpArticle.insertMany([
    {
      slug: 'introduction-to-oxy',
      title: 'Introduction',
      summary: 'Learn why Oxy is the CRM of the future.',
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

  console.log('\nSeed complete! All collections reset with original data.')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
