/**
 * Seed script — populates MongoDB with the original static content.
 * Always drops existing data first (full reset).
 *
 * Usage: npm run seed
 */
import mongoose from 'mongoose'
import { config } from './config.js'
import { Navigation } from './models/Navigation.js'
import { Footer } from './models/Footer.js'
import { PricingPlan } from './models/PricingPlan.js'
import { Testimonial } from './models/Testimonial.js'
import { ChangelogEntry } from './models/ChangelogEntry.js'
import { Job } from './models/Job.js'
import { SiteSettings } from './models/SiteSettings.js'
import { Page } from './models/Page.js'
import { NewsroomPost } from './models/NewsroomPost.js'
import TrackedRepo from './models/TrackedRepo.js'

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  // ── Drop all collections (full reset) ──
  const collections = [Navigation, Footer, PricingPlan, Testimonial, ChangelogEntry, Job, SiteSettings, Page, NewsroomPost]
  await Promise.all(collections.map((m) => m.deleteMany({})))
  console.log('Cleared all collections')

  // ── Navigation (exact copy of static data) ──
  await Navigation.insertMany([
    {
      label: 'Platform',
      order: 0,
      items: [
        { title: 'Ask Oxy', description: 'Search and create with AI', href: '#', section: 'CRM Platform' },
        { title: 'AI', description: 'Native to your CRM', href: '#', icon: 'ai', section: 'CRM Platform' },
        { title: 'Data model', description: 'Sync and enrich your data', href: '#', icon: 'data', section: 'CRM Platform' },
        { title: 'Productivity & collaboration', description: 'Context for your team operations', href: '#', icon: 'collaboration', section: 'CRM Platform' },
        { title: 'Workflows', description: 'Automate any process', href: '#', icon: 'automations', section: 'Automations' },
        { title: 'Sequences', description: 'Personalized outreach', href: '#', icon: 'sequences', section: 'Automations' },
        { title: 'Call Intelligence', description: 'Record and analyze meetings', href: '#', icon: 'call-intelligence', section: 'Insights' },
        { title: 'Reporting', description: 'Insights in real time', href: '#', icon: 'reporting', section: 'Insights' },
        { title: 'Developer Platform', description: 'Build on Oxy', href: '#', icon: 'developers', section: 'Ecosystem' },
        { title: 'Apps', description: 'Extend with integrations', href: '#', icon: 'apps', section: 'Ecosystem' },
      ],
      sidePanel: {
        heading: 'Get started',
        links: [
          { label: 'Oxy 101', href: '#' },
          { label: 'Hire an expert', href: '#' },
          { label: 'Startup program', href: '#' },
          { label: 'Talk to sales', href: '#' },
        ],
      },
    },
    {
      label: 'Resources',
      order: 1,
      items: [
        { title: 'Help center', description: "Learn more about Oxy's features", href: '#', icon: 'help-center', section: 'Support' },
        { title: 'Academy', description: 'Essential Oxy features explained', href: '#', icon: 'academy', section: 'Support' },
        { title: 'Developer docs', description: 'Start building Oxy apps', href: '#', icon: 'developers', section: 'Developers' },
        { title: 'Partner programs', description: 'Developers, creators, consultants', href: '#', icon: 'partners', section: 'Partners' },
      ],
      sidePanel: {
        heading: 'Company',
        links: [
          { label: 'Changelog', href: '#' },
          { label: 'Announcements', href: '#' },
          { label: 'Engineering blog', href: '#' },
          { label: 'Careers', href: '#' },
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
          { label: 'Refer a team', href: '#', isNew: true },
          { label: 'Changelog', href: '#' },
          { label: 'iOS app', href: '#', isExternal: true },
          { label: 'Android app', href: '#', isExternal: true },
          { label: 'Security', href: '#' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', href: '#' },
          { label: 'How Our Business Works', href: '#' },
          { label: 'Careers', href: '/company/careers' },
          { label: 'Investor Relations', href: '#' },
          { label: 'Transparency Center', href: '#' },
          { label: 'Community Guidelines', href: '#' },
          { label: 'Manifesto', href: '#' },
          { label: 'Announcements', href: '#' },
          { label: 'Engineering blog', href: '#', isNew: true },
          { label: 'Become a partner', href: '#' },
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
          { label: 'Mention', href: '#' },
          { label: 'Moovo', href: '#' },
          { label: 'Helpio', href: '#' },
          { label: 'Syra', href: 'https://syra.oxy.so/' },
          { label: 'Homiio', href: 'https://homiio.com/' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Startup program', href: '#' },
          { label: 'Help center', href: '#' },
          { label: 'Automation templates', href: '#' },
          { label: 'Developers', href: '#', isExternal: true },
          { label: 'System status', href: '#', isExternal: true },
          { label: 'Hire an expert', href: '#' },
          { label: 'Downloads', href: '#' },
        ],
      },
    ],
    socialLinks: [
      { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/company/oxyhq/' },
      { label: 'X', icon: 'x', href: 'https://x.com/oxyhqinc' },
      { label: 'Dribbble', icon: 'dribbble', href: '#' },
      { label: 'YouTube', icon: 'youtube', href: '#' },
    ],
    copyright: 'Made with 💚 in the 🌎 by Oxy.',
  })
  console.log('Seeded footer')

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
  await SiteSettings.create({
    siteTitle: 'Oxy — The AI-Powered CRM for Go-To-Market Teams',
    siteDescription: 'Search, update, and create across your entire CRM just by asking. Oxy is the AI CRM with Universal Context that deeply understands your business.',
    ogImage: 'https://oxy.so/og-default.png',
    banner: { text: 'Introducing Ask Oxy — AI-powered CRM intelligence', href: '#', visible: true },
  })
  console.log('Seeded site settings')

  // ── Changelog (sample) ──
  await ChangelogEntry.insertMany([
    { title: 'Ask Oxy public beta', content: 'Ask Oxy is now available to all workspaces.', tags: ['ai', 'beta'], date: new Date('2026-03-20'), items: ['Natural language CRM queries', 'Meeting intelligence', 'Call recording & analysis'] },
    { title: 'Workflow automations v2', content: 'Major update to the workflow engine.', tags: ['automations', 'release'], date: new Date('2026-03-10'), items: ['Conditional branching', 'Multi-step sequences', 'Webhook triggers'] },
  ])
  console.log('Seeded changelog')

  // ── Tracked Repos (sample) ──
  await TrackedRepo.deleteMany({})
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
    { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', description: 'Build the next generation of Oxy products.', active: true },
    { title: 'AI/ML Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', description: 'Work on Ask Oxy and our AI infrastructure.', active: true },
    { title: 'Product Designer', department: 'Design', location: 'Remote', type: 'Full-time', description: 'Design beautiful, accessible experiences.', active: true },
  ])
  console.log('Seeded jobs')

  console.log('\nSeed complete! All collections reset with original data.')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
