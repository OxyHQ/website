/* ──────────────────────────────────────────────
 * en.ts — canonical English source of truth.
 *
 * Every key declared here MUST exist in every
 * other locale file. New keys are added here first,
 * then propagated to es/fr/de/.../ar via the
 * matching files in this directory.
 *
 * Scope (per spec): chrome + landing-page marketing
 * copy. MDX bodies under /help, /academy, /company
 * are handled by sibling `.es.mdx` files via the
 * dedicated content loaders.
 *
 * Brand terms (Oxy, FairCoin, Mention, Allo, Bloom,
 * Codea, Astro, Alia, OxyOS, Homiio, TNP, Inbox)
 * are never translated.
 * ──────────────────────────────────────────── */

const en = {
  // ── Common UI ─────────────────────────────────────────────
  common: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    signUp: 'Sign up',
    startForFree: 'Start for free',
    getStarted: 'Get started',
    learnMore: 'Learn more',
    readMore: 'Read more',
    seeAll: 'See all',
    viewAll: 'View all',
    viewMore: 'View more',
    seeMore: 'See more',
    explore: 'Explore',
    open: 'Open',
    close: 'Close',
    dismiss: 'Dismiss',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading…',
    submit: 'Submit',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    contactUs: 'Contact us',
    contactSales: 'Contact sales',
    talkToSales: 'Talk to sales',
    bookDemo: 'Book a demo',
    requestDemo: 'Request a demo',
    tryItFree: 'Try it free',
    download: 'Download',
    installNow: 'Install now',
    backToHome: 'Back to home',
    pageNotFound: 'Page not found',
    notFoundDescription: "The page you're looking for doesn't exist or has been moved.",
    error: 'Error',
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Try again',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    new: 'New',
    soon: 'Soon',
    beta: 'Beta',
    free: 'Free',
    yes: 'Yes',
    no: 'No',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    changeLanguage: 'Change language',
    dismissBanner: 'Dismiss banner',
  },

  // ── Navbar ────────────────────────────────────────────────
  navbar: {
    homepage: 'Oxy homepage',
    technologies: 'Technologies',
    products: 'Products',
    pricing: 'Pricing',
    company: 'Company',
    developers: 'Developers',
    resources: 'Resources',
    bannerDefault: 'Alia. Think better, together.',
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    description:
      'Oxy is an open-source technology ecosystem building ethical, privacy-first tools that serve humanity. From social networking to AI, messaging to housing — technology with purpose.',
    copyright: 'Made with 💚 in the 🌎 by Oxy.',
    legal: 'Legal',
    privacyPolicy: 'Privacy Policy',
    cookiePolicy: 'Cookie Policy',
    accessibility: 'Accessibility',
    termsAndConditions: 'Terms & Conditions',
    llms: 'LLMs',
    settings: 'Settings',
    socialLinkedIn: 'LinkedIn',
    socialX: 'X',
  },

  // ── Homepage ──────────────────────────────────────────────
  home: {
    heroTitleDefault: 'Creating a future where technology empowers individuals\nto live connected, fulfilling, and sustainable lives.',
    heroEyebrowDefault: 'Built by people who believe in change. Ethical, open, and deeply human.',
    allInOneHeadingLine1: 'Build for everyone,',
    allInOneHeadingLine2: 'not just yourself.',
    allInOneBody:
      'Oxy exists because we believe technology should serve humanity, not exploit it. Through community-driven projects and open-source tools, we prove that helping people and building sustainable systems aren’t competing goals.',
    allInOneCta: 'Explore the Ecosystem',
    independentEcosystem: 'Independent Ecosystem',
    independentEcosystemBody:
      'Radically transparent, fiercely human. No ads. No data selling. No venture capital strings. Just purpose-driven tools designed for real-world impact.',
    statsOpenSource: 'Open Source',
    statsOpenSourceDesc: 'of our code is public',
    statsCommunity: 'Community',
    statsCommunityDesc: 'developers and contributors',
    statsProducts: 'Products',
    statsProductsDesc: 'platforms serving real needs',
    statsDataSold: 'Data Sold',
    statsDataSoldDesc: 'we never sell user data',
    statsCountries: 'Countries',
    statsCountriesDesc: 'communities worldwide',
    productMentionLabel: 'Mention',
    productAlloLabel: 'Allo',
    productInboxLabel: 'Inbox',
    productFairCoinLabel: 'FairCoin',
    productHomiioLabel: 'Homiio',
    productAliaLabel: 'Alia',
    productCodeaLabel: 'Codea',
    productOxyAILabel: 'Oxy AI',
    productTNPLabel: 'TNP',
    productOxyOSLabel: 'Oxy OS',
    coreValueDataYours: 'Your Data Stays Yours',
    coreValueHumanFirst: 'Human-first Design',
    coreValueAIPurpose: 'AI with a Purpose',
    coreValueOpenDefault: 'Open by Default',
  },

  // ── Pricing ───────────────────────────────────────────────
  pricing: {
    seoTitle: 'Pricing',
    seoDescription:
      'Pricing for the Oxy ecosystem. Most Oxy apps are free and open source; paid plans add hosting, support, and team features. Start free, scale as you grow.',
    heading: 'Pricing that grows with you.',
    subheading: 'Most of Oxy is free and open source. Paid plans add hosting, support, and team features.',
    annual: 'Annual',
    monthly: 'Monthly',
    saveAnnual: 'Save with annual',
    perMonth: 'per month',
    perYear: 'per year',
    billedAnnually: 'billed annually',
    custom: 'Custom',
    contactSales: 'Contact sales',
    mostPopular: 'Most popular',
    creditsPerMonth: 'credits / month',
    tierCommunity: 'Community',
    tierContributor: 'Contributor',
    tierOrganization: 'Organization',
    tierFree: 'Free',
    tierPlus: 'Plus',
    tierPro: 'Pro',
    tierEnterprise: 'Enterprise',
    faqHeading: 'Frequently asked questions',
    compareHeading: 'Compare plans',
    chooseYourPlan: 'Choose your plan',
  },

  // ── Help center ───────────────────────────────────────────
  help: {
    seoTitle: 'Help Center',
    seoDescription:
      'Get help with Oxy. Find answers to common questions, troubleshooting guides, and contact our support team.',
    heading: 'How can we help?',
    subheading: 'Browse articles, troubleshooting guides, and best practices.',
    searchPlaceholder: 'Search help articles…',
    categoriesHeading: 'Browse by category',
    popularHeading: 'Popular articles',
    contactCta: "Can't find what you need?",
    contactCtaDescription: 'Our support team is here to help — usually replies within a few hours.',
    contactCtaButton: 'Contact support',
    articleCountOne: '1 article',
    articleCountOther: '{count} articles',
    lastUpdated: 'Last updated {date}',
    wasThisHelpful: 'Was this article helpful?',
    helpfulYes: 'Yes',
    helpfulNo: 'No',
  },

  // ── Academy ───────────────────────────────────────────────
  academy: {
    seoTitle: 'Academy',
    seoDescription:
      'Learn how to build with Oxy. Free, in-depth courses covering the platform, SDKs, and the broader ethical-tech ecosystem.',
    heading: 'Learn Oxy, your way.',
    subheading: 'In-depth, free courses on every part of the Oxy ecosystem — from your first sign-in to shipping your own integration.',
    coursesHeading: 'All courses',
    lessonsLabelOne: '1 lesson',
    lessonsLabelOther: '{count} lessons',
    durationLabel: '{minutes} min',
    startCourse: 'Start course',
    continueCourse: 'Continue course',
    completedBadge: 'Completed',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    backToCourses: 'Back to courses',
    backToCourse: 'Back to course',
    nextLesson: 'Next lesson',
    previousLesson: 'Previous lesson',
    inThisCourse: 'In this course',
    aboutThisCourse: 'About this course',
  },

  // ── Company ───────────────────────────────────────────────
  company: {
    seoTitle: 'Company',
    seoDescription:
      'We build ethical technology that solves real problems, giving people the tools to shape their own futures. Learn about our mission, values, culture, and team.',
    ourInitiative: 'Our initiative',
    viewCareers: 'View careers',
    teamHeading: 'Team',
    teamSubheading: 'Meet some of the people building Oxy.',
    teamSeeAll: 'See all',
    valuesHeading: 'Our values',
    valuesDescription:
      'The principles that guide everything we do — from the features we ship to how we show up every day.',
    openRolesHeading: 'Open roles',
    openRolesSubheading:
      "We're a global, remote-first team building open-source technology that matters.",
    openRolesCount: 'We have {count} open positions',
    viewOpenRoles: 'View open roles',
    latestNews: 'Latest news',
    findAnswers: 'Find answers',
  },

  // ── Manifesto / Mission / Transparency / Business (shared CTAs) ──
  companyPages: {
    partnerWithUs: 'Partner with us',
    joinTheTeam: 'Join the team',
    talkToTeam: 'Talk to the team',
  },

  // ── Newsroom / Changelog ─────────────────────────────────
  newsroom: {
    seoTitle: 'Newsroom',
    seoDescription: 'Latest news, announcements, and stories from the Oxy team.',
    heading: 'Newsroom',
    subheading: 'Announcements, milestones, and stories from across the Oxy ecosystem.',
    featuredHeading: 'Featured',
    allPostsHeading: 'All posts',
    backToNewsroom: 'Back to newsroom',
    publishedOn: 'Published {date}',
    by: 'by {author}',
    minRead: '{count} min read',
    relatedPosts: 'Related posts',
    sharePost: 'Share',
  },
  changelog: {
    seoTitle: 'Changelog',
    seoDescription: 'Every shipped change across the Oxy ecosystem, in one place.',
    heading: 'Changelog',
    subheading: 'A running log of new features, improvements, and fixes across every Oxy product.',
    filterAll: 'All',
    filterFeature: 'Features',
    filterImprovement: 'Improvements',
    filterFix: 'Fixes',
    noResults: 'No changes match the current filter.',
    publishedOn: 'Published {date}',
  },

  // ── FairCoin landing ──────────────────────────────────────
  faircoin: {
    seoTitle: 'FairCoin',
    seoDescription: 'A digital currency built for sustainability and fair exchange.',
    heroEyebrow: 'A currency that cares.',
    heroTitle: 'Money that respects people and planet.',
    heroSubtitle:
      'FairCoin is a digital currency designed for sustainability and fair exchange — not speculation. Powering ethical commerce, mutual aid, and local economies worldwide.',
    buyNow: 'Buy FairCoin',
    learnHow: 'Learn how it works',
    bridge: 'Bridge',
    redeem: 'Redeem',
    wallet: 'Wallet',
  },

  // ── Codea (developer IDE) ─────────────────────────────────
  codea: {
    seoTitle: 'Codea',
    seoDescription:
      'Codea — a modern, web-based code editor for the Oxy ecosystem with AI assistance and instant deploys.',
    heroEyebrow: 'Codea',
    heroTitle: 'A modern code editor for the web.',
    heroSubtitle:
      'Write, run, and ship code from any browser. Built-in AI assistance, instant deploys, and a workspace that travels with you.',
    openEditor: 'Open editor',
    getExtension: 'Get the extension',
  },

  // ── Astro (browser) ───────────────────────────────────────
  astro: {
    seoTitle: 'Astro Browser',
    seoDescription:
      'Astro — a privacy-first browser built on Chromium, designed around the Oxy ecosystem.',
    heroEyebrow: 'Astro',
    heroTitle: 'A browser that puts you back in control.',
    heroSubtitle:
      'Astro is a privacy-first browser built on Chromium, deeply integrated with the Oxy ecosystem. No tracking, no telemetry, just the web — finally yours.',
    download: 'Download Astro',
    learnMore: 'Learn more',
  },

  // ── AI (Alia & friends) ───────────────────────────────────
  ai: {
    seoTitle: 'Oxy AI',
    seoDescription:
      'Oxy AI — intelligent assistance that respects your privacy. Powered by Alia, our open-source AI assistant.',
    heroEyebrow: 'Oxy AI',
    heroTitle: 'Intelligence with integrity.',
    heroSubtitle:
      'Alia is your private, open-source AI assistant. Built to help, never to harvest. Available across the Oxy ecosystem and on its own.',
    tryAlia: 'Try Alia',
    seePricing: 'See pricing',
    pricingHeading: 'AI pricing',
    pricingSubheading: 'Predictable plans for individuals and teams. Bring your own keys if you prefer.',
  },

  // ── Common product card / link surfaces ───────────────────
  products: {
    mentionDescription: 'Open-source social network. Federated, ad-free, and yours to own.',
    alloDescription: 'End-to-end encrypted messaging with group chats, voice, and media.',
    inboxDescription: 'All your conversations in one place, across every Oxy product.',
    aliaDescription: 'Your private AI assistant — intelligent, helpful, and privacy-first.',
    codeaDescription: 'A modern web-based code editor with AI assistance.',
    homiioDescription: 'Affordable housing made accessible through open technology.',
    faircoinDescription: 'A digital currency built for sustainability and fair exchange.',
    tnpDescription: 'The New Protocol — an alternative namespace for digital identity.',
    oxyOSDescription: 'A privacy-first operating system built around the Oxy ecosystem.',
    astroDescription: 'A privacy-first browser deeply integrated with Oxy.',
  },

  // ── SEO / hreflang generic strings ────────────────────────
  seo: {
    siteName: 'Oxy',
  },

  // ── Errors / 404 ──────────────────────────────────────────
  errors: {
    notFoundTitle: '404 — Page not found',
    notFoundDescription: "Sorry, we couldn't find that page. It may have been moved or removed.",
    notFoundCta: 'Back to homepage',
  },
}

export default en

/**
 * Strongly-typed key surface derived from the English dictionary. All values
 * are widened to `string` so the per-locale dictionaries can carry the same
 * shape with different translated strings without TypeScript complaining
 * that "Hola" is not assignable to the literal "Hello".
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }
export type Translations = Widen<typeof en>
