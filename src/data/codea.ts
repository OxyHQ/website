export interface CodeaFeature {
  title: string
  description: string
  cta: string
  ctaHref: string
}

export const heroTitle = 'Built to make you extraordinarily productive, Codea is the best way to code with AI.'

export const logoCompanies = [
  'Stripe', 'OpenAI', 'Linear', 'Datadog', 'Notion', 'Shopify', 'Vercel', 'Supabase'
]

export const features: CodeaFeature[] = [
  { title: 'Agents turn ideas into code', description: 'Accelerate development by handing off tasks to Codea, while you focus on making decisions.', cta: 'Learn about agentic development \u2192', ctaHref: '#' },
  { title: 'Tab predicts your next move', description: 'A multi-line autocomplete that suggests edits across your codebase, adapting to your style.', cta: 'Read about Tab \u2192', ctaHref: '#' },
  { title: 'Cmd-K generates and edits', description: 'Edit and write code with natural language. Generate entire functions or refactor existing ones.', cta: 'Discover more features \u2192', ctaHref: '#' },
]

export interface ChangelogEntry {
  version: string
  date: string
  items: string[]
}

export const changelogEntries: ChangelogEntry[] = [
  { version: '0.50', date: 'Mar 2026', items: ['Agent mode improvements', 'Memory & project rules', 'Background agents'] },
  { version: '0.49', date: 'Feb 2026', items: ['Multi-file editing', 'Improved context', 'Bug tracker integration'] },
  { version: '0.48', date: 'Jan 2026', items: ['MCP support', 'New onboarding', 'Performance improvements'] },
]

export const pressQuotes = [
  { quote: 'Codea is the future of programming.', source: 'TechCrunch' },
  { quote: 'The AI code editor everyone is talking about.', source: 'The Verge' },
  { quote: 'A leap forward in developer productivity.', source: 'Wired' },
]

export const footerLinks = [
  { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Download'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
  { title: 'Resources', links: ['Documentation', 'Community', 'Support', 'Status'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
]

export const highlights = [
  { title: 'Background Agents', description: 'Run tasks in the cloud while you focus on other work.' },
  { title: 'Bug Finder', description: 'Automatically detect and fix bugs across your codebase.' },
  { title: 'Memory', description: 'Codea remembers your preferences and project context.' },
]
