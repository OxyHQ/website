import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import {
  MagnifyingGlass,
  ArrowLeft,
  ArrowRight,
  EnvelopeSimple,
  Tag,
  ChatCircleText,
} from '@phosphor-icons/react'
import { PrimaryButton, TextButton } from '@oxy.so/bloom/button'
import { Link } from 'react-router-dom'
import PageSection from '../layout/PageSection'
import FaqSection from '../sections/FaqSection'

const messages = [
  {
    id: 'plans',
    name: 'Alex',
    subject: 'A little room for big ideas',
    text: 'I put our notes together. Shall we take a look tomorrow?',
    label: 'Personal',
    body: 'I put our notes together after our conversation. There is a lot to explore, and no need to rush it. Shall we take a look tomorrow?',
  },
  {
    id: 'studio',
    name: 'Studio',
    subject: 'The next chapter',
    text: 'A few thoughts for our next conversation.',
    label: 'Work',
    body: 'Here are the notes for our next conversation. Let’s start with the things people need most and work from there.',
  },
  {
    id: 'weekend',
    name: 'Sam',
    subject: 'See you on Saturday?',
    text: 'Coffee, a walk, and a good catch-up.',
    label: 'Personal',
    body: 'There is a new place around the corner. Coffee on Saturday? We can take a walk afterwards.',
  },
]
const scenes = [
  {
    title: 'A clearer view.',
    text: 'Bring your email into focus. Open a conversation and keep its messages together.',
    icon: EnvelopeSimple,
  },
  {
    title: 'Find your own order.',
    text: 'Use search and labels to make room for what you need next.',
    icon: Tag,
  },
  {
    title: 'Keep the conversation going.',
    text: 'Read the context, take your time and write a reply.',
    icon: ChatCircleText,
  },
]

function InboxExample() {
  const [query, setQuery] = useState('')
  const [label, setLabel] = useState('All')
  const [selected, setSelected] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const item = messages.find((m) => m.id === selected)
  const filtered = messages.filter(
    (m) =>
      (label === 'All' || m.label === label) &&
      `${m.name} ${m.subject} ${m.text}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card text-card-foreground shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-3">
          <img src="/images/apps/inbox.png" alt="" className="size-8 object-contain" />
          <span className="font-display text-xl">Inbox</span>
        </div>
        <span className="text-xs text-muted-foreground">Interactive illustration</span>
      </div>
      <div className="min-h-[400px] p-5 sm:p-8">
        {item ? (
          <div>
            <TextButton
              onPress={() => {
                setSelected(null)
                setSent(false)
                setReply('')
              }}
            >
              <ArrowLeft size={18} /> Back to messages
            </TextButton>
            <p className="mt-8 text-sm text-muted-foreground">{item.name} · Example conversation</p>
            <h3 className="mt-3 font-display text-3xl leading-tight">{item.subject}</h3>
            <p className="mt-6 text-base leading-relaxed">{item.body}</p>
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (reply.trim()) setSent(true)
              }}
            >
              <label className="grid gap-2 text-sm">
                Try a reply
                <textarea
                  className="min-h-24 rounded-xl border border-border bg-background p-4 text-foreground"
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value)
                    setSent(false)
                  }}
                  placeholder="Write an example reply…"
                />
              </label>
              <PrimaryButton
                onPress={() => {
                  if (reply.trim()) setSent(true)
                }}
                disabled={!reply.trim()}
              >
                Preview reply
              </PrimaryButton>
              <p className="text-sm text-muted-foreground" role="status">
                {sent
                  ? 'Example reply added. No message was sent.'
                  : 'This illustration uses sample messages. It does not connect to your account.'}
              </p>
            </form>
          </div>
        ) : (
          <div>
            <h3 className="font-display text-3xl">A little more space.</h3>
            <label className="mt-6 flex items-center gap-3 rounded-full border border-border bg-background px-4 py-3">
              <MagnifyingGlass size={20} />
              <input
                aria-label="Search example messages"
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
                placeholder="Find a conversation"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="my-5 flex gap-2" role="group" aria-label="Filter sample messages">
              {['All', 'Personal', 'Work'].map((name) => (
                <button
                  key={name}
                  aria-pressed={name === label}
                  onClick={() => setLabel(name)}
                  className={`rounded-full px-4 py-2 text-sm ${name === label ? 'bg-primary text-primary-foreground' : 'bg-surface'}`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="divide-y divide-border">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m.id)}
                  className="flex w-full gap-4 rounded-lg py-5 text-left transition-colors hover:bg-primary-subtle"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    {m.name[0]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-muted-foreground">{m.name}</span>
                    <span className="mt-1 block text-base font-semibold">{m.subject}</span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {m.text}
                    </span>
                  </span>
                </button>
              ))}
              {!filtered.length && (
                <p className="py-10 text-base text-muted-foreground">
                  No example messages match. Try another search or label.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InboxPageContent() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [36, -36])
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2])
  return (
    <>
      <PageSection spacing="lg" className="inbox-theme bg-background text-foreground">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="oxy-eyebrow mb-8">Inbox by Oxy</p>
            <h1 className="oxy-display">
              Email.
              <br />
              Room to think.
            </h1>
            <p className="oxy-copy mt-8">
              Your conversations, with space to read, organise and reply.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <a
                href="https://inbox.oxy.so"
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-7 py-3 text-primary-foreground"
              >
                Open Inbox <ArrowRight size={20} />
              </a>
              <a className="oxy-link" href="#inbox-story">
                Take a closer look
              </a>
            </div>
          </div>
          <div ref={ref}>
            <motion.div style={reduce ? {} : { y, rotate }}>
              <InboxExample />
            </motion.div>
          </div>
        </div>
      </PageSection>
      <div id="inbox-story" className="oxy-anchor inbox-theme bg-surface text-foreground">
        <div className="container grid gap-12 py-20 lg:grid-cols-[.8fr_1.2fr]">
          <div className="self-start lg:sticky lg:top-36">
            <p className="oxy-eyebrow mb-6">A day in your inbox</p>
            <h2 className="oxy-title">
              Less searching.
              <br />
              More conversation.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              A familiar place for your email, built as part of Oxy.
            </p>
          </div>
          <div>
            {scenes.map((scene, index) => (
              <section
                key={scene.title}
                className="oxy-reveal flex min-h-[55svh] flex-col justify-center border-t border-border py-16"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-sm">0{index + 1}</span>
                  <scene.icon size={40} weight="regular" className="text-primary" />
                </div>
                <h3 className="font-display text-[clamp(2rem,4vw,4rem)] leading-tight tracking-tight">
                  {scene.title}
                </h3>
                <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted-foreground">
                  {scene.text}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
      <PageSection spacing="lg">
        <p className="oxy-eyebrow mb-6">Part of Oxy</p>
        <h2 className="oxy-title max-w-4xl">
          Familiar foundations.
          <br />A place of its own.
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {[
            ['Oxy account', 'Use your Oxy account to access Inbox.', '/help/account'],
            [
              'Built with Bloom',
              'A shared design foundation across the Oxy ecosystem.',
              '/developers/docs/bloom/components',
            ],
            [
              'Open source',
              'Explore the client, follow development and contribute.',
              'https://github.com/OxyHQ/inbox',
            ],
          ].map(([a, b, url]) => (
            <div key={a}>
              <h3 className="text-2xl font-display">{a}</h3>
              <p className="my-4 text-lg text-muted-foreground">{b}</p>
              {url.startsWith('http') ? (
                <a href={url} className="oxy-link">
                  Explore the source
                </a>
              ) : (
                <Link to={url} className="oxy-link">
                  Learn more
                </Link>
              )}
            </div>
          ))}
        </div>
      </PageSection>
      <FaqSection
        title="A few things to know."
        groups={[
          {
            title: 'Inbox',
            items: [
              {
                question: 'What is Inbox?',
                answer:
                  'Inbox is the email client in the Oxy ecosystem. Open the web app to access your account and see the available features.',
              },
              {
                question: 'Is the example connected to my email?',
                answer:
                  'No. The interactive illustration uses sample messages to explain reading, searching and replying. It does not send mail or connect to an account.',
              },
              {
                question: 'Where can I follow development?',
                answer:
                  'The Inbox client is open source at github.com/OxyHQ/inbox. You can explore the code and follow changes there.',
              },
            ],
          },
        ]}
        className="inbox-theme bg-background"
      />
      <PageSection spacing="lg" className="inbox-theme bg-primary text-primary-foreground">
        <h2 className="oxy-title max-w-4xl">
          Make room for
          <br />
          your next conversation.
        </h2>
        <a href="https://inbox.oxy.so" className="oxy-link mt-8 text-xl">
          Open Inbox <ArrowRight size={24} />
        </a>
      </PageSection>
    </>
  )
}
