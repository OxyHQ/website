import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoIcon, LogoText } from '@oxy.so/services/ui/client'
import { TextButton } from '@oxy.so/bloom/button'
import PageShell from '../components/layout/PageShell'
import PageSection from '../components/layout/PageSection'
import RecipePreview from '../components/brand/RecipePreview'
import { BRAND_MARKS } from '../data/brand-assets'

const chapters = [
  ['principles', 'Principles'],
  ['identity', 'Identity'],
  ['colour', 'Colour'],
  ['type', 'Typography'],
  ['motion', 'Motion'],
  ['voice', 'Voice'],
  ['imagery', 'Imagery'],
  ['social', 'Social'],
  ['resources', 'Resources'],
] as const
const voiceExamples = {
  Product: {
    principle: 'Start with what a person can do. Show the feature, then explain the detail.',
    before: 'Experience a revolutionary, seamless ecosystem.',
    after: 'One account for the Oxy apps you use.',
    note: 'A concrete benefit. Add the supported apps and a useful next step.',
  },
  Principles: {
    principle: 'State a belief plainly. Connect it to a decision people can inspect.',
    before: 'We are the most ethical platform in the world.',
    after: 'Your attention belongs to you.',
    note: 'Follow the principle with the relevant product policy or a specific design decision.',
  },
  Support: {
    principle: 'Acknowledge the problem, explain what is known and give the next step.',
    before: 'Oops! Something went wrong. Try again later.',
    after: 'Your message has not been sent. Check your connection and try again.',
    note: 'Use this wording only when the failure is a connection problem and retry is safe.',
  },
  Release: {
    principle: 'Name the change and its availability. Make it easy to see the difference.',
    before: 'Big things are coming. Get ready for the future.',
    after: 'You can now preview Bloom recipes on a complete interface.',
    note: 'Example launch copy. Publish only after the feature is available, with a link to try it.',
  },
} as const
const social = [
  [
    'A principle',
    'Your attention belongs to you.',
    'A short statement, followed by the product decision that supports it.',
  ],
  [
    'A useful detail',
    'Small details. More control.',
    'Show one setting or interaction in a short, readable demonstration.',
  ],
  [
    'Work in progress',
    'Here is what we are working on.',
    'Share the actual change, the question being explored and a way to contribute.',
  ],
]

export default function BrandPage() {
  const [voice, setVoice] = useState<keyof typeof voiceExamples>('Product')
  const [replay, setReplay] = useState(0)
  const example = voiceExamples[voice]
  return (
    <PageShell
      seo={{
        title: 'Oxy brand guidelines',
        description:
          'The Oxy identity: principles, Bloom colour recipes, typography, motion, voice, imagery and social communication.',
        canonicalPath: '/brand',
      }}
      className="oxy-guide bg-background text-foreground"
    >
      <PageSection spacing="lg">
        <div className="grid items-end gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="oxy-eyebrow mb-8">Oxy / Brand guidelines</p>
            <h1 className="oxy-display">
              Many ideas.
              <br />
              One Oxy.
            </h1>
            <p className="oxy-copy mt-8">
              How we look, move and speak. A shared language for everything we build.
            </p>
          </div>
          <div className="flex min-h-64 items-center justify-center rounded-[3rem] bg-primary-subtle p-12">
            <LogoIcon height={160} color="var(--primary)" letterColor="var(--primary-foreground)" />
          </div>
        </div>
      </PageSection>
      <nav
        aria-label="Brand chapters"
        className="container flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-5"
      >
        {chapters.map(([id, label]) => (
          <a className="oxy-link text-sm" key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <PageSection id="principles" className="oxy-anchor" spacing="lg">
        <p className="oxy-eyebrow mb-6">01 / Principles</p>
        <h2 className="oxy-title max-w-4xl">Make room for people.</h2>
        <p className="oxy-copy mt-8">
          Oxy builds around people's ability to choose, understand and participate. Our identity
          should make those intentions tangible, from a small control to a whole product.
        </p>
        <div className="oxy-guide-grid mt-12">
          {[
            ['Human', 'Begin with a recognisable need. Speak to a person. Show real situations.'],
            [
              'Open',
              'Explain how things work and where the limits are. Make room for contribution.',
            ],
            [
              'Considered',
              'Give every colour, word and transition a purpose. Keep the next step clear.',
            ],
          ].map(([title, body]) => (
            <div key={title} className="oxy-guide-panel">
              <h3 className="text-2xl font-display">{title}</h3>
              <p className="mt-4 text-lg leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <Link className="oxy-link mt-8" to="/company/charter">
          Read our founding charter
        </Link>
      </PageSection>
      <PageSection id="identity" className="oxy-anchor" tone="surface" spacing="lg">
        <p className="oxy-eyebrow mb-6">02 / Identity</p>
        <h2 className="oxy-title">A recognisable family.</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="oxy-guide-panel flex min-h-72 items-center justify-center">
            <LogoIcon height={120} color="var(--primary)" letterColor="var(--primary-foreground)" />
          </div>
          <div className="oxy-guide-panel flex min-h-72 items-center justify-center">
            <LogoText height={72} color="var(--foreground)" />
          </div>
        </div>
        <div className="oxy-guide-grid mt-8">
          {[
            [
              'Keep the geometry',
              'Use the original artwork. Preserve its proportions, orientation and internal spacing. Do not reconstruct the mark with type or new shapes.',
            ],
            [
              'Give it space',
              'Keep text, borders and other marks clear of the silhouette. As a working minimum, leave one quarter of the mark height on each side. Check small uses at their actual size.',
            ],
            [
              'Protect recognition',
              'Use the symbol for compact spaces and the wordmark when the name needs to be read. Place it on a calm surface with clear contrast. Animate the whole mark; keep its geometry intact.',
            ],
            [
              'Let products belong',
              'Products keep their own names and marks. Shared type, colour recipes, icon rules and movement make the relationship with Oxy visible.',
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </PageSection>
      <PageSection id="colour" className="oxy-anchor" spacing="lg">
        <p className="oxy-eyebrow mb-6">03 / Colour</p>
        <h2 className="oxy-title">Colour, in relationship.</h2>
        <p className="oxy-copy my-8">
          Bloom is the design foundation of Oxy. Its recipes connect backgrounds, text, actions and
          supporting colours. Choose a recipe for the story, then keep its roles consistent.
        </p>
        <RecipePreview />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ['Identity', 'The primary colour establishes the product or editorial context.'],
            [
              'Hierarchy',
              'Supporting colours distinguish actions and surfaces without competing for attention.',
            ],
            [
              'Meaning',
              'Success, warning and error keep their semantic roles across every recipe. Colour always has a second cue.',
            ],
          ].map(([a, b]) => (
            <p key={a} className="text-lg">
              <strong>{a}.</strong> {b}
            </p>
          ))}
        </div>
        <Link to="/developers/docs/bloom/color-system" className="oxy-link mt-8">
          Explore the Bloom colour system
        </Link>
      </PageSection>
      <PageSection id="type" className="oxy-anchor" tone="surface" spacing="lg">
        <p className="oxy-eyebrow mb-6">04 / Typography & icons</p>
        <h2 className="oxy-title">
          Big ideas.
          <br />
          Clear details.
        </h2>
        <div className="mt-12 space-y-8">
          <div className="border-b border-border pb-8">
            <p className="text-sm mb-4">Blomus Modernus / Display</p>
            <p className="font-display text-[clamp(2.5rem,6vw,6rem)] leading-tight">
              Build for everyone.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm mb-4">Inter / Reading & interface</p>
              <p className="font-sans text-2xl leading-relaxed">
                Give each sentence one job. Leave enough space to read it.
              </p>
            </div>
            <div>
              <p className="text-sm mb-4">Geist Mono / Code & precise data</p>
              <p className="font-mono text-xl">
                import &#123; Button &#125; from '@oxy.so/bloom/button'
              </p>
            </div>
          </div>
        </div>
        <p className="oxy-copy mt-10">
          Use sentence case, a clear reading order and responsive sizes. Keep interface labels
          legible. Use Bloom's icon vocabulary for controls, with consistent weight, alignment and
          optical size. Product marks remain distinct from interface icons.
        </p>
      </PageSection>
      <PageSection id="motion" className="oxy-anchor" spacing="lg">
        <p className="oxy-eyebrow mb-6">05 / Motion</p>
        <h2 className="oxy-title">A story that moves.</h2>
        <p className="oxy-copy mt-8">
          Every landing page has a sequence of scenes. Movement reveals relationships, brings the
          product forward and carries the story into the next section.
        </p>
        <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
          <div className="flex min-h-80 items-center justify-center rounded-3xl bg-primary-subtle">
            <div key={replay} className="oxy-motion-sample">
              <LogoIcon
                height={100}
                color="var(--primary)"
                letterColor="var(--primary-foreground)"
              />
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-display">Responsive. Expressive. Recognisable.</h3>
            <p className="text-lg">
              Quick feedback for a press. A softer arrival for content. More time for a product
              scene. Use the same easing language across pages, while giving each story its own
              choreography.
            </p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt>Feedback</dt>
              <dd>160 ms</dd>
              <dt>Content arrival</dt>
              <dd>600 ms</dd>
              <dt>Scene transition</dt>
              <dd>900 ms</dd>
            </dl>
            <TextButton onPress={() => setReplay((n) => n + 1)}>Replay motion</TextButton>
          </div>
        </div>
        <p className="oxy-copy mt-8">
          Keep scrolling under the visitor's control. Essential content stays available when
          animation is reduced. On smaller screens, simplify the scene while preserving the story
          and its actions.
        </p>
      </PageSection>
      <PageSection id="voice" className="oxy-anchor" tone="surface" spacing="lg">
        <p className="oxy-eyebrow mb-6">06 / Voice & tone</p>
        <h2 className="oxy-title">
          Say something.
          <br />
          Mean it.
        </h2>
        <p className="oxy-copy mt-8">
          Our voice is clear, warm and direct. We are confident about our principles and precise
          about what a product can do. We explain limitations as carefully as benefits.
        </p>
        <div className="mt-10 flex flex-wrap gap-3" role="group" aria-label="Writing context">
          {(Object.keys(voiceExamples) as (keyof typeof voiceExamples)[]).map((key) => (
            <button
              key={key}
              onClick={() => setVoice(key)}
              aria-pressed={voice === key}
              className={`rounded-full border border-border px-6 py-3 text-base ${voice === key ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="oxy-guide-panel mt-6" aria-live="polite">
          <h3 className="text-xl font-semibold">{example.principle}</h3>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Rewrite</p>
              <p className="mt-3 text-xl text-muted-foreground">{example.before}</p>
            </div>
            <div>
              <p className="text-sm text-primary-text">Oxy voice</p>
              <p className="mt-3 text-2xl font-display">{example.after}</p>
            </div>
          </div>
          <p className="mt-8 text-base text-muted-foreground">{example.note}</p>
        </div>
        <ul className="mt-10 grid gap-5 text-lg md:grid-cols-2">
          <li>Lead with the useful point. Prefer familiar words and active verbs.</li>
          <li>Use “you” for the person and “we” when Oxy owns a decision.</li>
          <li>
            Explain one benefit with a concrete example. Remove superlatives and vague promises.
          </li>
          <li>
            Use humour sparingly. Errors, privacy and account access need calm, specific language.
          </li>
          <li>
            Distinguish available features, experiments and ambitions. Date time-sensitive claims.
          </li>
          <li>
            Translate the intention naturally. Preserve product names and verify every CTA
            destination.
          </li>
        </ul>
      </PageSection>
      <PageSection id="imagery" className="oxy-anchor" spacing="lg">
        <p className="oxy-eyebrow mb-6">07 / Imagery & product</p>
        <h2 className="oxy-title">Show what matters.</h2>
        <div className="oxy-guide-grid mt-10">
          {[
            [
              'Product first',
              'Show the actual product, at a readable scale. Build demonstrations around one task. Use prepared example data and identify illustrative concepts.',
            ],
            [
              'People and context',
              'Use situations that explain why the product matters. Choose images with a clear subject and room for the composition to breathe.',
            ],
            [
              'Objects and materials',
              'Carry the identity into packaging and physical objects through scale, placement, colour and finish. Keep the mark legible on the actual material.',
            ],
          ].map(([a, b]) => (
            <div className="oxy-guide-panel" key={a}>
              <h3 className="text-2xl font-display">{a}</h3>
              <p className="mt-4 text-lg leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </PageSection>
      <PageSection id="social" className="oxy-anchor" tone="surface" spacing="lg">
        <p className="oxy-eyebrow mb-6">08 / Social communication</p>
        <h2 className="oxy-title">
          Give people something
          <br />
          worth their time.
        </h2>
        <p className="oxy-copy mt-8">
          A useful detail. A belief made concrete. An honest look at work in progress. Each post
          should stand on its own and offer a reason to explore further.
        </p>
        <div className="oxy-guide-grid mt-10">
          {social.map(([label, title, note]) => (
            <div key={label} className="oxy-guide-panel flex min-h-80 flex-col justify-between">
              <p className="text-sm">{label} / Example</p>
              <p className="my-8 font-display text-4xl leading-tight">{title}</p>
              <p className="text-base text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
        <p className="oxy-copy mt-8">
          Keep a recognisable type hierarchy, a deliberate Bloom recipe and consistent logo
          placement. Caption video, respect safe areas and write useful alternative text. Adapt the
          crop and pacing to each channel.
        </p>
      </PageSection>
      <PageSection id="resources" className="oxy-anchor" spacing="lg">
        <p className="oxy-eyebrow mb-6">09 / Resources</p>
        <h2 className="oxy-title">Build from the same place.</h2>
        <p className="oxy-copy mt-8">
          These product marks are the shared assets used by the website's documentation. Preserve
          the original artwork when applying them.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(BRAND_MARKS).map(([name, url]) => (
            <a
              key={name}
              href={url}
              download
              className="oxy-guide-panel flex flex-col items-center gap-6 text-center"
            >
              <img src={url} alt="" className="size-16 object-contain" loading="lazy" />
              <span className="text-sm">{name} ↓</span>
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-8">
          <Link className="oxy-link" to="/developers/docs/bloom/components">
            Bloom components
          </Link>
          <Link className="oxy-link" to="/developers/docs/bloom/playground">
            Open playground
          </Link>
          <a className="oxy-link" href="https://github.com/OxyHQ/website">
            Website source
          </a>
        </div>
      </PageSection>
    </PageShell>
  )
}
