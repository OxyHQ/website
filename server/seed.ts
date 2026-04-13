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
  const collections = [Navigation, Footer, PricingPlan, Testimonial, ChangelogEntry, Job, SiteSettings, Page, NewsroomPost, TrackedRepo]
  await Promise.all(collections.map((m) => m.deleteMany({})))
  console.log('Cleared all collections')

  // ── Navigation (exact copy of static data) ──
  await Navigation.insertMany([
    {
      label: 'Platform',
      order: 0,
      items: [
        { title: 'Ask Oxy', description: 'Search and create with AI', href: '/', section: 'CRM Platform' },
        { title: 'AI', description: 'Native to your CRM', href: '/ai', icon: 'ai', section: 'CRM Platform' },
        { title: 'Data model', description: 'Sync and enrich your data', href: '#', icon: 'data', section: 'CRM Platform' },
        { title: 'Productivity & collaboration', description: 'Context for your team operations', href: '#', icon: 'collaboration', section: 'CRM Platform' },
        { title: 'Workflows', description: 'Automate any process', href: '#', icon: 'automations', section: 'Automations' },
        { title: 'Sequences', description: 'Personalized outreach', href: '#', icon: 'sequences', section: 'Automations' },
        { title: 'Call Intelligence', description: 'Record and analyze meetings', href: '#', icon: 'call-intelligence', section: 'Insights' },
        { title: 'Reporting', description: 'Insights in real time', href: '#', icon: 'reporting', section: 'Insights' },
        { title: 'Developer Platform', description: 'Build on Oxy', href: '/developers/docs', icon: 'developers', section: 'Ecosystem' },
        { title: 'Apps', description: 'Extend with integrations', href: '#', icon: 'apps', section: 'Ecosystem' },
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
        { title: 'Academy', description: 'Essential Oxy features explained', href: '#', icon: 'academy', section: 'Support' },
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
      label: 'Ecosystem',
      order: 2,
      items: [
        { title: 'Mention', description: 'Decentralized social media', href: '#', icon: 'mention', section: 'Social & Communication' },
        { title: 'Alia', description: 'AI-powered assistant', href: 'https://alia.onl/', icon: 'alia', section: 'Social & Communication' },
        { title: 'Inbox', description: 'Unified messaging hub', href: '#', icon: 'inbox', section: 'Social & Communication' },
        { title: 'Shh', description: 'Private encrypted chat', href: '#', icon: 'shh', section: 'Social & Communication' },
        { title: 'FairCoin', description: 'Ethical digital currency', href: 'https://fairco.in/', icon: 'faircoin', section: 'Finance & Commerce' },
        { title: 'FairCoin Wallet', description: 'Manage your FairCoin', href: 'https://fairco.in/wallet', icon: 'faircoin-wallet', section: 'Finance & Commerce' },
        { title: 'FairCoin Explorer', description: 'Browse the blockchain', href: '#', icon: 'faircoin-explorer', section: 'Finance & Commerce' },
        { title: 'Marketplace', description: 'Buy and sell with crypto', href: '#', icon: 'marketplace', section: 'Finance & Commerce' },
        { title: 'Homiio', description: 'Real estate platform', href: 'https://homiio.com/', icon: 'homiio', section: 'Apps' },
        { title: 'Horizon', description: 'Project management', href: '#', icon: 'horizon', section: 'Apps' },
        { title: 'Moovo', description: 'Urban mobility network', href: '#', icon: 'moovo', section: 'Apps' },
        { title: 'TNP', description: 'Alternative namespace system', href: '/tnp', icon: 'tnp', section: 'Infrastructure' },
      ],
      sidePanel: {
        heading: 'Explore',
        links: [
          { label: 'All products', href: '#' },
          { label: 'Open source', href: '#' },
          { label: 'Developer platform', href: '#' },
          { label: 'Status page', href: '#' },
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
          { label: 'How Our Business Works', href: '#' },
          { label: 'Careers', href: '/company/careers' },
          { label: 'Investor Relations', href: '#' },
          { label: 'Transparency Center', href: '#' },
          { label: 'Community Guidelines', href: '#' },
          { label: 'Manifesto', href: '#' },
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
  await NewsroomPost.insertMany([
    {
      title: 'Introducing Ask Oxy: AI-Powered CRM Intelligence',
      slug: 'introducing-ask-oxy-ai-powered-crm-intelligence',
      resume: 'Ask Oxy is our new AI engine that lets you search, update, and create across your entire CRM using natural language.',
      description: 'A deep dive into the technology behind Ask Oxy and how it transforms the way sales teams interact with their CRM.',
      content: '<p>Today we are launching Ask Oxy, a new AI-powered interface that fundamentally changes how you interact with your CRM. Instead of clicking through menus and filters, you simply ask.</p><p>Ask Oxy understands context from your emails, meetings, and deal history to surface exactly what you need — before you even know you need it.</p>',
      coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1553729459-ade9a7b3b02e?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop',
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
      coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop',
      imageAlt: 'Cybersecurity concept with digital shield',

      tags: ['security', 'ai', 'research'],
      categories: ['Research'],
      featured: false,
      status: 'published',
      publishedAt: new Date('2026-01-08'),
    },
  ])
  console.log('Seeded newsroom posts')

  console.log('\nSeed complete! All collections reset with original data.')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
