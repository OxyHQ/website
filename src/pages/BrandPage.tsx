import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ArrowDown, Plus, Minus } from '@phosphor-icons/react'
import { LogoIcon, LogoText } from '@oxy.so/services/ui/client'
import { APP_COLOR_PRESETS, type AppColorName } from '@oxy.so/bloom/color-presets'
import PageShell from '../components/layout/PageShell'
import { recipeStyle } from '../components/brand/RecipePreview'
import { useSiteHeaderBottom } from '../hooks/useSiteHeaderBottom'
import { BRAND_MARKS } from '../data/brand-assets'
import homePhoto from '../assets/homiio/industria.jpg'
import '../styles/brand-book.css'

const chapters = [
  ['idea', 'The idea'],
  ['identity', 'Identity'],
  ['colour', 'Colour'],
  ['type', 'Type & icons'],
  ['imagery', 'Imagery'],
  ['motion', 'Motion'],
  ['voice', 'Voice'],
  ['applications', 'In the world'],
  ['resources', 'Resources'],
] as const
const recipes: AppColorName[] = ['orange', 'cobalt', 'grove', 'pink', 'yellow', 'oxy']
const voices = {
  Principles: {
    headline: 'Your attention belongs to you.',
    body: 'Mention has no ads. Your feed is a place for the people and conversations you choose.',
    rule: 'Connect a belief to a product decision. Let people judge the decision for themselves.',
    avoid: 'The world’s most ethical social platform.',
  },
  Product: {
    headline: 'One account. Your Oxy apps.',
    body: 'Use your Oxy account to sign in to Mention, Inbox and the other Oxy apps you use.',
    rule: 'Explain what someone can do. Name the product and the practical benefit.',
    avoid: 'Experience a revolutionary, seamless ecosystem.',
  },
  Support: {
    headline: 'Your message has not been sent.',
    body: 'Check your connection and try again.',
    rule: 'Explain what happened and what to do next. Use this example only for a confirmed connection problem.',
    avoid: 'Oops! Something went wrong.',
  },
  Release: {
    headline: 'A closer look at Bloom.',
    body: 'Browse the components. Change a colour recipe. Try an example in the playground.',
    rule: 'Show the change, say where it is available and give people a way to try it.',
    avoid: 'Big things are coming. The future is here.',
  },
} as const

function Chapter({ number, title }: { number: string; title: string }) {
  return (
    <div className="brand-chapter">
      <span>{number}</span>
      <span>{title}</span>
    </div>
  )
}
function Mark({ word = false, className = '' }: { word?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={`brand-mark ${className}`}>
      {word ? (
        <LogoText height={220} color="currentColor" letterColor="var(--primary)" />
      ) : (
        <LogoIcon height={220} color="currentColor" letterColor="var(--primary)" />
      )}
    </div>
  )
}
function Rules({ items }: { items: [string, string][] }) {
  return (
    <div className="brand-rules">
      {items.map(([title, body]) => (
        <article key={title}>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      ))}
    </div>
  )
}
function ColourStudio() {
  const [recipe, setRecipe] = useState<AppColorName>('cobalt')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  return (
    <>
      <div className="brand-studio-controls">
        <div className="brand-recipe-buttons" role="group" aria-label="Colour recipes">
          {recipes.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={recipe === name}
              onClick={() => setRecipe(name)}
              aria-label={`${name.charAt(0).toUpperCase() + name.slice(1)} recipe`}
            >
              <span style={{ background: APP_COLOR_PRESETS[name].hex }} />
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
        <label className="brand-select-label">
          Appearance
          <select
            aria-label="Colour studio appearance"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <div
        className="brand-colour-composition"
        style={recipeStyle(recipe, mode)}
        data-testid="brand-colour-composition"
        data-recipe={recipe}
        data-mode={mode}
      >
        <div className="brand-colour-poster">
          <span className="brand-meta">Oxy / An open invitation</span>
          <p>
            There’s
            <br />
            room for
            <br />
            <em>you.</em>
          </p>
          <div className="brand-poster-bottom">
            <span>
              Make something
              <br />
              that matters.
            </span>
            <Mark />
          </div>
        </div>
        <div className="brand-colour-ui">
          <div className="brand-meta">Same recipe. Different job.</div>
          <div className="brand-ui-example">
            <span className="brand-meta">Bloom / Components</span>
            <h3>Make it yours.</h3>
            <p>Explore the details that make an interface feel right.</p>
            <Link
              to={`/developers/docs/bloom/playground?component=Button&recipe=${recipe}&mode=${mode}`}
            >
              Try this recipe <ArrowUpRight size={20} />
            </Link>
            <div className="brand-ui-secondary">Built with Bloom.</div>
          </div>
          <div className="brand-role-strip">
            {['primary', 'secondary', 'tertiary', 'background'].map((role) => (
              <div
                key={role}
                style={{
                  background: `var(--${role})`,
                  color: `var(--${role === 'background' ? 'foreground' : `${role}-foreground`})`,
                }}
              >
                <span>{role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="brand-note-row">
        <p>
          Choose a relationship, then compose with it. A campaign can give colour the whole canvas.
          A working interface reserves stronger colour for actions and emphasis.
        </p>
        <Link to="/developers/docs/bloom/color-system">
          Explore all Bloom recipes <ArrowUpRight size={18} />
        </Link>
      </div>
    </>
  )
}
function TypeStudio() {
  const [text, setText] = useState('Made for everyone.')
  const [size, setSize] = useState(96)
  return (
    <div className="brand-type-studio">
      <div className="brand-type-controls">
        <label>
          Try a headline
          <input
            aria-label="Try a headline"
            maxLength={65}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label>
          Type size
          <input
            aria-label="Type size"
            type="range"
            min="40"
            max="120"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
      </div>
      <div
        className="brand-type-specimen"
        style={{ '--specimen-size': `${size / 16}rem` } as CSSProperties}
        aria-live="polite"
      >
        {text || 'Made for everyone.'}
      </div>
      <div className="brand-type-foot">
        <span>Aa Bb Cc Dd Ee Ff Gg</span>
        <span>0123456789?!&</span>
      </div>
    </div>
  )
}
function MotionStudio() {
  const [replay, setReplay] = useState(0)
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  return (
    <div className="brand-motion-studio" style={recipeStyle('grove', 'light')}>
      <div className="brand-motion-stage">
        <motion.div
          key={replay}
          className="brand-moving-mark"
          initial={reduce ? false : { y: 90, rotate: -25, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <Mark />
        </motion.div>
        <button className="brand-text-button" onClick={() => setReplay((r) => r + 1)}>
          Replay entrance <span aria-hidden="true">↻</span>
        </button>
      </div>
      <div className="brand-motion-example">
        <span className="brand-meta">Motion that answers you.</span>
        <button
          className="brand-disclosure"
          aria-expanded={open}
          aria-controls="brand-motion-answer"
          onClick={() => setOpen((v) => !v)}
        >
          What changes when I open this? {open ? <Minus size={28} /> : <Plus size={28} />}
        </button>
        <div id="brand-motion-answer" hidden={!open} className="brand-disclosure-answer">
          The answer stays connected to the question. The control changes state. Nothing else on the
          page needs to move.
        </div>
        <p>
          Use movement to reveal, connect and respond. Give large scenes time to settle; keep
          everyday controls immediate.
        </p>
        <div className="brand-timing">
          <span>
            Feedback
            <br />
            <strong>160 ms</strong>
          </span>
          <span>
            Entrance
            <br />
            <strong>600–900 ms</strong>
          </span>
        </div>
        <small>
          Reduced motion keeps the same content and controls, with spatial movement removed.
        </small>
      </div>
    </div>
  )
}

export default function BrandPage() {
  const [voice, setVoice] = useState<keyof typeof voices>('Principles')
  const headerBottom = useSiteHeaderBottom()
  const example = voices[voice]
  return (
    <PageShell
      className="brand-book bg-background text-foreground"
      hideFooterDivider
      seo={{
        title: 'The Oxy identity',
        description:
          'A visual guide to the Oxy identity. Our principles, colour, typography, imagery, motion and voice, working together.',
        canonicalPath: '/brand',
      }}
    >
      <header className="brand-cover" style={recipeStyle('orange', 'light')}>
        <div className="brand-cover-top">
          <span>The Oxy identity</span>
          <span>A living guide / 2026</span>
        </div>
        <h1 className="brand-cover-title">
          Technology belongs
          <br />
          to people.
        </h1>
        <Mark word className="brand-cover-wordmark" />
        <div className="brand-cover-bottom">
          <p>
            How we look.
            <br />
            How we speak.
            <br />
            What we stand for.
          </p>
          <a href="#idea">
            Explore the identity <ArrowDown size={22} />
          </a>
        </div>
      </header>
      <nav className="brand-index" aria-label="Brand chapters" style={{ top: headerBottom }}>
        <span className="brand-index-label">Oxy / Identity</span>
        <div>
          {chapters.map(([id, name]) => (
            <a key={id} href={`#${id}`}>
              {name}
            </a>
          ))}
        </div>
      </nav>
      <section id="idea" className="brand-section brand-idea">
        <Chapter number="01" title="The idea" />
        <h2>
          Progress means
          <br />
          more when
          <br />
          <span>it’s for everyone.</span>
        </h2>
        <div className="brand-editorial-row">
          <p>
            Oxy is a collection of tools, products and ideas built around people’s ability to
            choose, create and participate.
          </p>
          <div>
            <p>
              That belief should be visible in the things we make. In the way a product gives you
              control. In the way a sentence tells you the truth. In the space we leave for someone
              else’s ideas.
            </p>
            <Link to="/company/charter">
              Read our charter <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <Rules
          items={[
            [
              'Open by intention',
              'Explain the decisions. Make room for contribution. Be clear about what is available and what is still being built.',
            ],
            [
              'Human in the details',
              'Use familiar words, readable type and useful interactions. Show people and their lives with care.',
            ],
            [
              'Distinct, together',
              'Let each product have character. Connect them through shared craft, clear language and the original Oxy identity.',
            ],
          ]}
        />
      </section>
      <section id="identity" className="brand-section">
        <Chapter number="02" title="Identity" />
        <div className="brand-section-intro">
          <h2>A familiar face.</h2>
          <p>
            The Oxy symbol carries the identity from an app icon to a whole page. Give it a clear
            place in the composition.
          </p>
        </div>
        <div className="brand-identity-boards">
          <div className="brand-symbol-board" style={recipeStyle('cobalt', 'light')}>
            <Mark />
            <span>01 / Symbol</span>
          </div>
          <div className="brand-wordmark-board" style={recipeStyle('yellow', 'light')}>
            <Mark word />
            <span>02 / Wordmark</span>
          </div>
        </div>
        <Rules
          items={[
            [
              'Keep the original.',
              'Use the supplied artwork. Preserve the outline, letterforms and proportions. Keep the complete mark visible when it identifies Oxy.',
            ],
            [
              'Give it room.',
              'Keep surrounding type and imagery clear of the silhouette. Check the mark at the size people will actually see, especially in avatars and navigation.',
            ],
            [
              'Let the family be a family.',
              'Homiio, Mention and the other products keep their own marks. Shared composition, colour recipes and language make the connection to Oxy.',
            ],
          ]}
        />
        <div className="brand-family">
          {Object.entries(BRAND_MARKS).map(([name, src]) => (
            <div key={name}>
              <img src={src} alt="" loading="lazy" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>
      <section id="colour" className="brand-section">
        <Chapter number="03" title="Colour" />
        <div className="brand-section-intro">
          <h2>
            Different colours.
            <br />
            Same character.
          </h2>
          <p>
            Bloom gives us a shared colour language. The composition gives each story its own
            expression.
          </p>
        </div>
        <ColourStudio />
      </section>
      <section id="type" className="brand-section">
        <Chapter number="04" title="Type & icons" />
        <div className="brand-section-intro">
          <h2>
            Make the words
            <br />
            worth looking at.
          </h2>
          <p>
            Set a clear hierarchy. Use scale to give an idea presence, then give the explanation
            space to be read.
          </p>
        </div>
        <TypeStudio />
        <Rules
          items={[
            [
              'Editorial type',
              'Use the shared sans serif for clear, open headlines and prose. Expressive display type belongs to deliberate product scenes, such as Homiio’s existing landing.',
            ],
            [
              'Readable rhythm',
              'Write short headings. Break lines by meaning. Keep paragraphs comfortably narrow and body text at least 16 px. Small screens deserve their own composition.',
            ],
            [
              'Icons with a job',
              'Use the shared Phosphor family consistently. Match weight and optical size. Label unfamiliar actions and reserve product marks for identity.',
            ],
          ]}
        />
        <div className="brand-icon-specimen" aria-label="Interface icon examples">
          <ArrowUpRight />
          <ArrowDown />
          <Plus />
          <Minus />
        </div>
      </section>
      <section id="imagery" className="brand-section">
        <Chapter number="05" title="Imagery" />
        <div className="brand-section-intro">
          <h2>
            Show what
            <br />
            it means.
          </h2>
          <p>
            Every image has a purpose: bring an idea to life, put a product in context or make a
            useful detail easier to understand.
          </p>
        </div>
        <figure className="brand-campaign-image">
          <img
            src="/images/landing/commons-night.webp"
            alt="An Oxy illustration of homes at night with illuminated symbols projected into the sky"
            loading="lazy"
          />
          <figcaption>
            <span>Ideas / An existing Oxy campaign illustration</span>
            <span>A recognisable world, beyond the interface.</span>
          </figcaption>
        </figure>
        <div className="brand-image-pair">
          <figure>
            <img
              src={homePhoto}
              alt="A bright living room with a sofa, window and natural light"
              loading="lazy"
            />
            <figcaption>
              <strong>Life around the product.</strong>
              <p>
                For Homiio, show a place someone could call home. Use images that help people
                understand the space.
              </p>
            </figcaption>
          </figure>
          <figure className="brand-product-figure" style={recipeStyle('cobalt', 'light')}>
            <div>
              <img
                src="/images/screenshots/mention-app.png"
                alt="Mention product interface"
                loading="lazy"
              />
            </div>
            <figcaption>
              <strong>The product, in focus.</strong>
              <p>
                Show the actual interface. Crop for the feature being discussed and keep its text
                readable.
              </p>
            </figcaption>
          </figure>
        </div>
        <p className="brand-image-note">
          Photography documents real situations. Illustration explores ideas. Product imagery shows
          what the product does. Label concept imagery and examples when they could be mistaken for
          a real person, place or available feature.
        </p>
      </section>
      <section id="motion" className="brand-section">
        <Chapter number="06" title="Motion" />
        <div className="brand-section-intro">
          <h2>
            Movement
            <br />
            with meaning.
          </h2>
          <p>
            A landing page can unfold as a story. A control should respond to your hand. Both should
            feel deliberate.
          </p>
        </div>
        <MotionStudio />
      </section>
      <section id="voice" className="brand-section">
        <Chapter number="07" title="Voice" />
        <h2>
          Sound like someone
          <br />
          you can talk to.
        </h2>
        <div className="brand-voice-tabs" role="group" aria-label="Voice examples">
          {Object.keys(voices).map((name) => (
            <button
              key={name}
              aria-pressed={voice === name}
              onClick={() => setVoice(name as keyof typeof voices)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="brand-voice-spread">
          <div aria-live="polite">
            <span className="brand-meta">Oxy / {voice}</span>
            <h3>{example.headline}</h3>
            <p>{example.body}</p>
          </div>
          <aside>
            <h4>Why it sounds like Oxy</h4>
            <p>{example.rule}</p>
            <h4>Leave this behind</h4>
            <p className="brand-voice-avoid">{example.avoid}</p>
          </aside>
        </div>
        <Rules
          items={[
            [
              'Say something specific.',
              'Name the change, the choice or the consequence. Explain ethical principles through decisions people can inspect.',
            ],
            [
              'Keep your feet on the ground.',
              'Be ambitious about the work and precise about what it can do today. Avoid superlatives, vague promises and invented numbers.',
            ],
            [
              'Meet the moment.',
              'Warmth in an invitation. Clarity in a release. Calm in support. Translate the meaning and tone, not just the words.',
            ],
          ]}
        />
      </section>
      <section id="applications" className="brand-section">
        <Chapter number="08" title="In the world" />
        <div className="brand-section-intro">
          <h2>
            One identity.
            <br />A lot to say.
          </h2>
          <p>
            Bring the same craft to a launch, a post and a product detail. These are composition
            examples for Oxy’s channels.
          </p>
        </div>
        <div className="brand-social-grid">
          <article className="brand-social" style={recipeStyle('yellow', 'light')}>
            <span>Oxy / A principle</span>
            <h3>
              Your
              <br />
              attention
              <br />
              belongs
              <br />
              to you.
            </h3>
            <Mark />
          </article>
          <article className="brand-social" style={recipeStyle('cobalt', 'light')}>
            <span>Bloom / An invitation</span>
            <h3>
              Ideas take
              <br />
              shape.
            </h3>
            <div className="brand-social-marks">
              <Mark />
              <Mark />
            </div>
            <span>Explore the components.</span>
          </article>
          <article className="brand-social brand-social-story">
            <img src={homePhoto} alt="A sunlit Homiio living room" loading="lazy" />
            <div style={recipeStyle('orange', 'light')}>
              <span>Homiio / A place to start</span>
              <h3>
                A little room
                <br />
                for your life.
              </h3>
            </div>
          </article>
        </div>
        <div className="brand-note-row">
          <p>
            Start a conversation with a belief, demonstrate one useful thing, or share work in
            progress. Keep the subject visible at phone size. Give each post a reason to exist.
          </p>
          <span className="brand-meta">Editorial examples / Not scheduled posts</span>
        </div>
      </section>
      <section id="resources" className="brand-section brand-resources">
        <Chapter number="09" title="Resources" />
        <h2>
          Make it
          <br />
          <em>Oxy.</em>
        </h2>
        <div className="brand-resource-links">
          <Link to="/developers/docs/bloom/components">
            Bloom components <ArrowUpRight />
          </Link>
          <Link to="/developers/docs/bloom/playground">
            Interactive playground <ArrowUpRight />
          </Link>
          <Link to="/company/charter">
            Our charter <ArrowUpRight />
          </Link>
        </div>
        <details>
          <summary>
            Product marks <Plus size={22} />
          </summary>
          <div className="brand-download-list">
            {Object.entries(BRAND_MARKS).map(([name, src]) => (
              <a key={name} href={src} download>
                <img src={src} alt="" loading="lazy" />
                <span>{name}</span>
                <span>Download</span>
              </a>
            ))}
          </div>
        </details>
        <p className="brand-resource-note">
          Use the original assets. Check small sizes, contrast and clear space in the actual
          composition. This guide evolves alongside the products.
        </p>
      </section>
    </PageShell>
  )
}
