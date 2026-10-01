import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Button, type ButtonProps } from '@oxy.so/bloom/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@oxy.so/bloom/accordion'
import { AgentAvatar, FOLD_PRESETS } from '@oxy.so/bloom/agent-avatar'
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'
import { BloomColorScope } from '@oxy.so/bloom/theme'
import { LocaleProvider as BloomLocaleProvider } from '@oxy.so/bloom/locale'
import { RiCodeSSlashLine } from '@oxy.so/bloom/icons/RiCodeSSlashLine'
import { RiLayoutGridLine } from '@oxy.so/bloom/icons/RiLayoutGridLine'
import { RiFileCopyLine } from '@oxy.so/bloom/icons/RiFileCopyLine'
import PageShell from '../components/layout/PageShell'
import ChartPreview from '../components/bloom/ChartPreview'
import BloomPreview, {
  type BloomDemoName,
} from '../components/bloom/BloomPreview'
import { Link } from '../lib/navigation'
import { useTranslation } from '../lib/i18n'
import { useCopyToClipboard } from '../lib/useCopyToClipboard'
import { BLOOM_SEO } from '../content/bloom-landing'
import '../styles/bloom-landing.css'

const DOCS = '/developers/docs/bloom/components/'
const CASES = ['chat', 'dashboard', 'health', 'projects', 'profile'] as const
const TEMPLATE_DOCS = {
  chat: 'ai-chat',
  dashboard: 'chart-cards',
  health: 'patient-info-card',
  projects: 'project-board',
  profile: 'ai-profile-card',
} as const
const COMPONENTS: {
  name: BloomDemoName
  title: string
  subpath: string
  previewClass: string
  canvasClass?: string
}[] = [
  {
    name: 'attachments',
    title: 'Composer attachments',
    subpath: 'composer-panel',
    previewClass:
      'absolute w-[699px] transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] top-7 left-6 origin-top-left scale-[0.88] sm:top-3 sm:left-10 sm:group-hover/card:-translate-x-[400px]',
  },
  {
    name: 'search',
    title: 'Web search',
    subpath: 'web-search',
    previewClass: 'absolute top-5 left-5 w-[430px]',
  },
  {
    name: 'limits',
    title: 'Agent limits',
    subpath: 'agent-limits-card',
    previewClass: 'absolute inset-y-0 top-4 left-4 overflow-hidden right-0',
    canvasClass:
      'w-[404px] origin-top-left scale-[min(calc((100cqw-16px)*0.92/404px),1)] sm:scale-[min(calc((100cqw-16px)/404px),1)]',
  },
  {
    name: 'table',
    title: 'Data table',
    subpath: 'data-table',
    previewClass:
      'absolute top-[15px] right-4 left-4 h-[212px] overflow-hidden rounded-[6px] xl:right-auto xl:left-[15px] xl:h-[179px] xl:w-[275px]',
    canvasClass:
      'w-[790px] origin-top-left scale-[calc((100cqw-32px)/790px)] xl:scale-100',
  },
  {
    name: 'widgets',
    title: 'Playful widgets',
    subpath: 'chart-cards',
    previewClass:
      'absolute inset-x-0 top-[18px] h-[179px] overflow-hidden sm:top-[21px] sm:h-[165px]',
    canvasClass: 'w-[740px] origin-top-left scale-50',
  },
  {
    name: 'sidebar',
    title: 'Sidebar',
    subpath: 'sidebar',
    previewClass:
      'absolute top-[19px] left-1/2 h-[732px] w-[260px] -translate-x-1/2 transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] [transition-delay:250ms] sm:group-hover/card:-translate-y-[554px] sm:group-hover/card:[transition-delay:0ms]',
  },
  {
    name: 'profile',
    title: 'Contributor profile',
    subpath: 'ai-profile-card',
    previewClass:
      'absolute top-[18px] right-0 left-4 flex h-[212px] justify-start overflow-hidden rounded-2xl py-1 pl-1.5 sm:right-4 sm:justify-center sm:p-2 xl:right-auto xl:left-[19px] xl:h-[179px] xl:w-[266px] xl:rounded-[10px] xl:p-0',
    canvasClass:
      'w-[680px] shrink-0 origin-top-left scale-[0.35] sm:origin-top',
  },
  {
    name: 'progress',
    title: 'Agent progress',
    subpath: 'agent-progress',
    previewClass:
      'absolute top-5 right-4 left-4 sm:top-[22px] sm:right-auto sm:w-[341px] sm:origin-top-left sm:scale-[calc((100cqw-32px)/341px)] xl:left-[21px] xl:scale-[0.765]',
  },
  {
    name: 'loader',
    title: 'Composer loader',
    subpath: 'composer-loader',
    previewClass:
      'absolute top-[68px] left-[19px] w-[700px] origin-top-left scale-125 transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] sm:scale-100 sm:group-hover/card:-translate-x-[436px]',
  },
  {
    name: 'thinking',
    title: 'Agent thinking',
    subpath: 'agent-thinking',
    previewClass: 'absolute inset-0 flex items-center justify-center p-5',
  },
  {
    name: 'image',
    title: 'Image generation loader',
    subpath: 'ai-chat',
    previewClass:
      'absolute top-[19px] left-1/2 w-[137px] -translate-x-1/2 overflow-hidden rounded-xl border border-border-button-default',
  },
  {
    name: 'calendar',
    title: 'Calendar',
    subpath: 'calendar',
    previewClass:
      'absolute top-[19px] left-4 w-[660px] origin-top-left scale-[calc((100cqw-32px)/660px)] xl:left-[17px] xl:scale-[0.41]',
  },
  {
    name: 'auth',
    title: 'Auth card',
    subpath: 'auth-card',
    previewClass:
      'absolute inset-y-0 top-4 left-4 overflow-hidden right-0 sm:right-4',
    canvasClass:
      'w-[400px] origin-top-left scale-[min(calc((100cqw-32px)/400px),1)]',
  },
  {
    name: 'meeting',
    title: 'Meeting schedule',
    subpath: 'date-picker',
    previewClass:
      'absolute top-[19px] left-4 flex h-[430px] w-[700px] origin-top-left scale-[calc((100cqw-32px)/1000px)] gap-4 rounded-3xl bg-background-secondary-default p-3 sm:scale-[calc((100cqw-32px)/700px)] xl:left-5 xl:scale-[0.47]',
  },
  {
    name: 'earnings',
    title: 'Charts',
    subpath: 'chart-cards',
    previewClass:
      'absolute inset-x-0 top-3 h-[198px] overflow-hidden sm:top-[21px] sm:h-[165px]',
    canvasClass: 'w-[596px] origin-top-left scale-50',
  },
  {
    name: 'upload',
    title: 'File upload',
    subpath: 'file-upload',
    previewClass: 'absolute top-8 left-1/2 w-[265px] -translate-x-1/2 sm:top-6',
  },
]
const CHARTS: { name: BloomDemoName; title: string }[] = [
  { name: 'funnel', title: 'Funnel chart' },
  { name: 'earnings', title: 'Earnings chart' },
  { name: 'radar', title: 'Radar chart' },
  { name: 'comparison', title: 'Radar comparison' },
  { name: 'sankey', title: 'Sankey chart' },
  { name: 'stages', title: 'Stage bars' },
  { name: 'radial', title: 'Radial chart' },
  { name: 'gauge', title: 'Speedometer' },
  { name: 'area', title: 'Area chart' },
  { name: 'combo', title: 'Combo chart' },
]

function ComponentPreview({ item }: { item: (typeof COMPONENTS)[number] }) {
  if (item.name === 'widgets' || item.name === 'earnings') {
    const names: BloomDemoName[] =
      item.name === 'widgets'
        ? ['activity', 'steps', 'sleep', 'days']
        : ['earnings', 'revenue']
    const width = item.name === 'widgets' ? 360 : 596
    return (
      <div className={item.previewClass}>
        <div className="animate-landing-marquee flex w-max [animation-duration:24s]">
          {[0, 1].map((copy) => (
            <div className="flex gap-2.5 pr-2.5" key={copy}>
              {names.map((name, i) => (
                <div
                  className="h-[165px] shrink-0 overflow-hidden"
                  style={{ width: width / 2 }}
                  key={i}
                >
                  <div className="origin-top-left scale-50" style={{ width }}>
                    <BloomPreview name={name} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (item.name === 'image') {
    return (
      <div className="absolute top-[19px] left-1/2 flex w-max -translate-x-1/2 gap-3 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)]">
        {[0, 1, 2].map((i) => (
          <div
            className="h-[171px] w-[137px] shrink-0 overflow-hidden rounded-xl border border-border-button-default"
            key={i}
          >
            <BloomPreview name="image" className="h-full [&>div]:h-full!" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className={item.previewClass}>
      <div className={item.canvasClass}>
        <BloomPreview
          className={
            item.name === 'profile'
              ? '[&>div>div:first-child]:hidden [&>div>div:nth-child(2)]:pt-4!'
              : undefined
          }
          name={
            item.name === 'calendar'
              ? 'calendar-view'
              : item.name === 'profile'
                ? 'ai-profile'
                : item.name === 'auth'
                  ? 'auth-signup'
                  : item.name
          }
        />
      </div>
      {item.name === 'search' && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-14 bg-linear-to-r from-transparent to-background-primary-default" />
      )}
    </div>
  )
}

/** Bloom renders the action; the geometry is the reference's h-9 / rounded-2lg. */
function Action({
  secondary = false,
  ...props
}: ButtonProps & { secondary?: boolean }) {
  const button = (
    <Button
      {...props}
      appearance={secondary ? 'outline' : 'solid'}
      tone={secondary ? 'neutral' : 'accent'}
      className="bloom-landing-action h-9 rounded-2lg p-2"
      textVariant="headline-medium"
      textStyle={{ fontSize: 15, fontWeight: '500' }}
      style={{
        borderRadius: 10,
        height: 36,
        paddingHorizontal: 12,
        borderWidth: secondary ? 1 : 0,
        borderColor: 'var(--border)',
      }}
    />
  )
  return button
}
function Heading({
  title,
  description,
  id,
  children,
}: {
  title: string
  description: string
  id?: string
  children?: ReactNode
}) {
  return (
    <div className="flex w-full max-w-[635px] flex-col items-center text-center">
      <h2
        id={id}
        className="text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-balance text-text-primary sm:text-[48px] sm:leading-[53px]"
      >
        {title}
      </h2>
      <p className="mt-4 max-w-[570px] text-headline-medium text-pretty text-text-secondary">
        {description}
      </p>
      {children}
    </div>
  )
}
function AgentMarks({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center -space-x-1" aria-hidden>
      {FOLD_PRESETS.slice(0, 4).map((preset, i) => (
        <div
          key={preset.name}
          style={{
            transform: `translateY(${i % 2 ? 10 : -8}px) rotate(${i % 2 ? 12 : -10}deg)`,
          }}
        >
          <AgentAvatar config={preset.config} size={size} label={preset.name} />
        </div>
      ))}
    </div>
  )
}

export default function BloomPage() {
  const { t, locale } = useTranslation()
  const reduce = useReducedMotion()
  const [currentCase, setCurrentCase] = useState(0)
  const [example, setExample] = useState<(typeof CASES)[number]>('chat')
  const [device, setDevice] = useState('desktop')
  const [spread, setSpread] = useState(false)
  const [faq, setFaq] = useState<string | string[] | undefined>()
  const { copied, copy } = useCopyToClipboard()
  useEffect(() => {
    if (reduce) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && window.scrollY < 500)
        setCurrentCase((v) => (v + 1) % CASES.length)
    }, 3600)
    return () => clearInterval(timer)
  }, [reduce])
  const text = (key: string) => t(`bloom.${key}`)
  return (
    <BloomLocaleProvider locale={locale}>
      <PageShell
        seo={{
          ...BLOOM_SEO,
          title: text('seoTitle'),
          description: text('description'),
        }}
        className="bloom-landing bg-background"
        mainClassName="relative flex flex-1 flex-col"
      >
        <div
          className="landing-grain pointer-events-none absolute inset-x-0 top-0 h-[1900px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] overflow-hidden"
          aria-hidden
        >
          <BloomColorScope colorPreset="blue" style={{ display: 'contents' }}>
            <div className="landing-glow absolute -top-10 right-[30%] h-[420px] w-[70px] rotate-6" />
          </BloomColorScope>
          <BloomColorScope colorPreset="rose" style={{ display: 'contents' }}>
            <div className="landing-glow absolute -top-10 right-[21%] h-[420px] w-[60px] -rotate-3" />
          </BloomColorScope>
        </div>
        <section className="relative mx-auto flex w-full max-w-[980px] flex-col items-start px-5 pt-[17px] text-left sm:items-center sm:px-6 sm:pt-[54px] sm:text-center">
          <Link
            className="lg-host group relative mb-5 inline-flex items-center gap-2 rounded-full border border-border-button-default bg-background-primary-default py-1 pr-3 pl-1.5 text-body-medium text-text-secondary shadow-xs sm:mb-6"
            to={DOCS}
          >
            <span className="rounded-full bg-background-secondary-default px-2 py-0.5 text-[11px] leading-4 font-semibold tracking-wide">
              Bloom UI
            </span>
            {text('eyebrow')}
          </Link>
          <h1 className="w-full max-w-full text-[36px] leading-[43px] font-medium tracking-[-0.02em] text-text-primary sm:text-[72px] sm:leading-[84px]">
            <span className="block">{text('title')}</span>
            <span className="flex w-full justify-start sm:justify-center">
              <span className="flex max-w-full items-baseline justify-start sm:inline-flex sm:justify-center">
                <span className="shrink-0">{text('for')}&nbsp;</span>
                <span
                  key={currentCase}
                  className="landing-hero-dither-character flex min-w-0 flex-1 flex-wrap gap-x-[0.25em] sm:inline-flex sm:flex-none sm:flex-nowrap"
                >
                  {text(CASES[currentCase]!)
                    .split(' ')
                    .map((word, i) => (
                      <span key={i}>{word}</span>
                    ))}
                </span>
              </span>
            </span>
          </h1>
          <p className="mt-4 max-w-[612px] text-[15px] leading-[21px] font-medium text-pretty text-text-secondary sm:mt-[25px] sm:text-headline-medium">
            {text('description')}
          </p>
          <div className="mt-4 flex w-full flex-row items-center justify-center gap-2.5 px-1 sm:mt-[25px] sm:px-0">
            <Action href="#install">{text('install')}</Action>
            <Action secondary asChild leadingIcon={RiLayoutGridLine}>
              <Link to={DOCS}>{text('components')}</Link>
            </Action>
          </div>
        </section>
        <section
          className="relative mx-auto mt-6 w-full max-w-[1200px] px-6 sm:mt-14"
          aria-label="Bloom UI stack"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-body-medium text-text-secondary">
            {['React', 'NativeWind', 'Expo', 'TypeScript'].map((name, i) => (
              <span key={name} className="inline-flex items-center gap-2">
                <RiCodeSSlashLine width={18} height={18} aria-hidden />
                {name}
                {i < 3 && (
                  <span className="ml-3 opacity-40" aria-hidden>
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>

        <div className="relative mt-4 sm:mt-8">
          <section
            className="w-full overflow-x-clip"
            aria-label={text('interactive')}
          >
            <div className="animate-landing-marquee flex w-max">
              {[0, 1].map((copy) => (
                <div
                  className="flex"
                  key={copy}
                  aria-hidden={copy === 1 || undefined}
                  inert={copy === 1 ? true : undefined}
                >
                  {(
                    [
                      'patient',
                      'steps',
                      'sleep',
                      'days',
                      'activity',
                      'alerts',
                    ] as const
                  ).map((name, i) => (
                    <div
                      className="landing-reveal mr-[11px] h-[182px] w-[198px] shrink-0 overflow-hidden [contain:layout_style_paint] sm:mr-5 sm:h-[330px] sm:w-[360px]"
                      style={
                        {
                          '--landing-reveal-delay': `${i * 0.1}s`,
                        } as CSSProperties
                      }
                      key={name}
                    >
                      <div className="w-[360px] origin-top-left scale-[.55] sm:scale-100">
                        <BloomPreview name={name} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
        <section
          className="relative mt-2 w-full overflow-x-clip sm:mt-5"
          aria-label={text('interactive')}
        >
          <div className="relative mx-auto h-[500px] sm:h-[944px]">
            <div
              className="absolute top-0 left-1/2 origin-top -translate-x-1/2 scale-50 [contain:layout] sm:scale-100"
              style={{ width: 1828, height: 944 }}
            >
              <div
                className="absolute flex w-[342px] flex-col gap-5"
                style={{ left: -86, top: 0 }}
              >
                <div className="landing-reveal rounded-3xl bg-background-secondary-default p-2">
                  <BloomPreview name="calendar" />
                </div>
                <div className="landing-reveal flex w-full items-center gap-3">
                  <BloomPreview name="controls" />
                </div>
                <div className="landing-reveal w-full">
                  <BloomPreview name="upload" />
                </div>
              </div>
              <div
                className="absolute flex w-[790px] flex-col gap-5"
                style={{ left: 276, top: 0 }}
              >
                <div className="landing-reveal">
                  <BloomPreview name="table" />
                </div>
                <div className="landing-reveal w-[657px] self-end sm:w-full">
                  <BloomPreview name="profile" />
                </div>
              </div>
              <div
                className="absolute flex items-start gap-5"
                style={{ left: 1086, top: 0 }}
              >
                <div className="landing-reveal h-[732px] shrink-0">
                  <BloomPreview name="sidebar" />
                </div>
                <div className="relative h-[944px] w-[626px] shrink-0">
                  <div className="landing-reveal absolute top-[752px] -left-[246px] w-[341px] sm:top-0 sm:left-0">
                    <BloomPreview name="progress" />
                  </div>
                  <div className="landing-reveal absolute top-0 left-[361px] w-[265px]">
                    <BloomPreview name="accounts" />
                  </div>
                  <div className="landing-reveal absolute top-[257px] left-[286px] w-[340px]">
                    <BloomPreview name="auth" />
                  </div>
                  <div className="landing-reveal absolute top-[255px] left-0 w-[266px]">
                    <BloomPreview name="models" />
                  </div>
                  <div className="landing-reveal absolute top-[591px] left-0">
                    <BloomPreview name="segments" />
                  </div>
                  <div className="landing-reveal absolute top-[647px] left-0 w-[180px]">
                    <BloomPreview name="checks" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto mt-24 flex w-full max-w-[1276px] flex-col items-center px-3 sm:px-6 xl:px-0"
          aria-labelledby="bloom-components"
        >
          <div className="flex w-full max-w-[521px] flex-col items-center gap-[18px] text-center sm:max-w-[600px]">
            <p className="flex items-baseline whitespace-nowrap font-mono text-[12px] leading-normal text-text-secondary sm:text-[18px]">
              <span>bun</span>
              <span className="ml-[1ch]">add</span>
              <span className="ml-[1ch]">@oxy.so/bloom</span>
            </p>
            <div className="flex w-full flex-col items-center gap-6">
              <Heading
                id="bloom-components"
                title={text('componentsTitle')}
                description={text('componentsDescription')}
              />
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Action href="#install">{text('install')}</Action>
                <Action secondary asChild leadingIcon={RiLayoutGridLine}>
                  <Link to={DOCS}>{text('components')}</Link>
                </Action>
              </div>
            </div>
          </div>
          <div className="mt-10 grid w-full grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-[repeat(4,304px)]">
            {COMPONENTS.map((item) => (
              <article
                className="landing-showcase-card group/card relative h-[332px] cursor-pointer overflow-hidden rounded-[28px] border border-transparent bg-background-primary-default [container-type:inline-size] dark:bg-transparent xl:h-[299px]"
                key={item.name}
              >
                <div className="group/preview relative h-[230px] w-full overflow-hidden xl:h-[197px]">
                  <div className="relative h-full w-full" inert>
                    <ComponentPreview item={item} />
                  </div>
                  {![
                    'attachments',
                    'widgets',
                    'thinking',
                    'image',
                    'earnings',
                  ].includes(item.name) && (
                    <div
                      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-11 bg-linear-to-b from-transparent to-background-primary-default transition-opacity ease-out duration-500 ${item.name === 'sidebar' ? '[transition-delay:0ms] [transition-duration:120ms] sm:group-hover/card:opacity-0 sm:group-hover/card:[transition-duration:400ms] sm:group-hover/card:[transition-delay:1400ms]' : ''}`}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1 px-5 pt-3 pb-5">
                  <h3 className="text-headline-medium text-text-primary">
                    {text(`cards.${item.name}.title`)}
                  </h3>
                  <p className="line-clamp-2 text-headline-regular text-pretty text-text-secondary">
                    {text(`cards.${item.name}.description`)}
                  </p>
                </div>
                <Link
                  className="absolute inset-0 z-50 rounded-[25px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring"
                  to={`${DOCS}${item.subpath}/`}
                >
                  <span className="sr-only">
                    {text('view')} {item.title}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section
          id="multi-agent-chat"
          className="mx-auto flex w-full max-w-[1276px] scroll-mt-20 flex-col items-center px-3 pt-40 pb-24 sm:px-6 sm:pt-48 sm:pb-32 xl:px-0"
          aria-labelledby="bloom-agents"
        >
          <div className="flex w-full max-w-[640px] flex-col items-center text-center">
            <div className="relative mb-6 flex h-28 w-40 items-center justify-center">
              <AgentMarks />
            </div>
            <Heading
              id="bloom-agents"
              title={text('agentsTitle')}
              description={text('agentsDescription')}
            />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Action secondary asChild>
                <Link to={`${DOCS}multi-agent-chat/`}>{text('docs')}</Link>
              </Action>
            </div>
          </div>
          <div
            className="relative isolate mt-16 w-full [--preview-inset:6px] sm:[--preview-inset:8px]"
            style={{ '--preview-radius': '31.45px' } as CSSProperties}
          >
            <div
              className="pointer-events-none absolute -top-[85px] left-14 z-20"
              aria-hidden
            >
              <AgentMarks size={68} />
            </div>
            <div className="relative z-10 rounded-[calc(var(--preview-radius)+var(--preview-inset)+1px)] border border-border-button-default bg-background-secondary-default p-1.5 shadow-lg sm:p-2">
              <BloomPreview name="multi-agent" />
            </div>
          </div>
        </section>
        <section
          className="mx-auto mt-36 flex w-full max-w-[1276px] flex-col items-center px-3 pb-16 sm:mt-56 sm:px-6 sm:pb-28 xl:px-0"
          aria-labelledby="bloom-loader"
        >
          <Heading
            id="bloom-loader"
            title={text('loaderTitle')}
            description={text('loaderDescription')}
          >
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Action asChild>
                <Link to={`${DOCS}composer-loader/`}>
                  {text('view')} ComposerLoader
                </Link>
              </Action>
            </div>
          </Heading>
          <div className="mt-10 flex h-[120px] w-full justify-center sm:h-[150px] lg:h-[200px] xl:h-[230px]">
            <div className="w-[560px] max-w-[calc(100vw-24px)] origin-top sm:scale-125 lg:scale-[1.75] xl:scale-200">
              <BloomPreview name="loader" />
            </div>
          </div>
        </section>

        <section
          className="mx-auto mt-40 flex w-full max-w-[1276px] flex-col items-center px-3 sm:px-6 xl:px-0"
          aria-labelledby="bloom-examples"
        >
          <Heading
            id="bloom-examples"
            title={text('examplesTitle')}
            description={text('examplesDescription')}
          >
            <div className="mt-6">
              <Action asChild>
                <Link to={DOCS}>
                  {text('components')}
                </Link>
              </Action>
            </div>
            <div className="mt-7 hidden sm:block">
              <SegmentedControl
                label={text('viewport')}
                type="radio"
                value={device}
                onValueChange={setDevice}
              >
                {['desktop', 'tablet', 'mobile'].map((name) => (
                  <SegmentedControlItem key={name} value={name}>
                    <SegmentedControlItemText>
                      {text(name)}
                    </SegmentedControlItemText>
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </div>
          </Heading>
          <div className="mt-[18px] w-full rounded-[28px] border border-border-button-default bg-background-primary-default p-1.5 sm:rounded-t-[38px] sm:rounded-br-[38px] sm:rounded-bl-[52px] sm:p-[18px]">
            <div className="mb-2 flex w-full items-center gap-1 sm:mb-3 sm:gap-2 lg:mb-[18px] lg:gap-3">
              <div className="-m-1 flex min-w-0 flex-1 flex-nowrap items-center justify-start gap-0.5 overflow-x-auto p-1 [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
                <SegmentedControl
                  label={text('examplesTitle')}
                  type="radio"
                  variant="plain"
                  value={example}
                  onValueChange={setExample}
                >
                  {CASES.map((name) => (
                    <SegmentedControlItem key={name} value={name}>
                      <SegmentedControlItemText>
                        {text(name)}
                      </SegmentedControlItemText>
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              </div>
              <Action secondary asChild>
                <Link to={`${DOCS}${TEMPLATE_DOCS[example]}/`}>
                  {text('view')}
                </Link>
              </Action>
            </div>
            <div className="flex aspect-[390/844] w-full justify-center sm:aspect-[768/900] lg:aspect-[1440/900]">
              <div
                className="bloom-template-canvas relative h-full w-full overflow-auto rounded-3xl border border-border-button-default bg-background-secondary-default transition-[width] duration-500 ease-[cubic-bezier(.22,1,.36,1)] [container-type:inline-size] motion-reduce:transition-none"
                data-device={device}
              >
                <BloomPreview name={`template-${example}`} className="h-full" />
              </div>
            </div>
          </div>
        </section>
        <section
          className="mx-auto mt-40 flex w-full max-w-[1276px] flex-col items-center px-3 sm:px-6 xl:px-0"
          aria-labelledby="bloom-charts"
        >
          <Heading
            id="bloom-charts"
            title={text('chartsTitle')}
            description={text('chartsDescription')}
          >
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Action asChild>
                <Link to={`${DOCS}chart-cards/`}>{text('components')}</Link>
              </Action>
            </div>
          </Heading>
          <div className="mt-10 grid w-full grid-cols-1 items-start gap-x-5 gap-y-3 sm:grid-cols-2 sm:gap-5">
            {CHARTS.map((item) => (
              <article
                className="landing-showcase-card group/card relative overflow-hidden rounded-[28px] border border-border-button-default bg-background-primary-default"
                key={item.name}
              >
                <ChartPreview
                  name={item.name}
                  height={
                    ['funnel', 'earnings'].includes(item.name)
                      ? 329
                      : ['sankey', 'stages'].includes(item.name)
                        ? 430
                        : ['area', 'combo'].includes(item.name)
                          ? 365
                          : 465
                  }
                />
                <div className="flex flex-col gap-1 px-5 pt-3 pb-5">
                  <h3 className="text-headline-medium text-text-primary">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 text-headline-regular text-pretty text-text-secondary">
                    {text('chartsDescription')}
                  </p>
                </div>
                <Link
                  className="absolute inset-0 z-50 rounded-[25px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring"
                  to={`${DOCS}chart-cards/`}
                >
                  <span className="sr-only">
                    {text('view')} {item.title}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          id="install"
          className="mx-auto mt-40 flex w-full max-w-[1276px] scroll-mt-24 flex-col items-center px-3 sm:px-6 xl:px-0"
          aria-labelledby="bloom-install"
        >
          <Heading
            id="bloom-install"
            title={text('installTitle')}
            description={text('installDescription')}
          />
          <div className="mt-[39px] flex w-full max-w-[843px] flex-col gap-[19px] lg:flex-row">
            <div className="flex flex-1 flex-col gap-5 rounded-[26px] border border-border-button-default bg-background-secondary-default p-6">
              <RiCodeSSlashLine width={28} height={28} aria-hidden />
              <h3 className="text-headline-medium">{text('install')}</h3>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2lg bg-background-primary-default p-3">
                <code className="text-sm">bun add @oxy.so/bloom</code>
                <Button
                  appearance="plain"
                  iconOnly
                  leadingIcon={RiFileCopyLine}
                  accessibilityLabel={
                    copied ? t('docs.copied') : t('common.copyCode')
                  }
                  onPress={() => {
                    void copy('bun add @oxy.so/bloom')
                  }}
                />
              </div>
              <Action asChild>
                <Link to="/developers/docs/bloom/">{text('setup')}</Link>
              </Action>
            </div>
            <div className="flex flex-1 flex-col gap-5 rounded-[26px] border border-border-button-default bg-background-primary-default p-6">
              <RiLayoutGridLine width={28} height={28} aria-hidden />
              <h3 className="text-headline-medium">{text('docs')}</h3>
              <p className="text-headline-regular text-text-secondary">
                {text('componentsDescription')}
              </p>
              <Action secondary asChild>
                <Link to={DOCS}>{text('components')}</Link>
              </Action>
              <a
                className="text-body-medium text-text-secondary"
                href="https://github.com/OxyHQ/Bloom/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
              >
                Breathe License 1.0
              </a>
            </div>
          </div>
        </section>
        <section
          className="mx-auto mt-24 flex w-full max-w-[1276px] flex-col items-center px-3 pb-12 sm:mt-36 sm:px-6 sm:pb-20 xl:px-0"
          aria-labelledby="bloom-github"
        >
          <Heading
            id="bloom-github"
            title={text('githubTitle')}
            description={text('githubDescription')}
          />
          <div className="mt-10 flex h-[72px] w-full justify-center sm:h-[90px] lg:h-[117px] xl:h-[144px]">
            <div className="origin-top scale-200 sm:scale-[2.5] lg:scale-[3.25] xl:scale-[4]">
              <Action
                secondary
                href="https://github.com/OxyHQ/Bloom"
                target="_blank"
                rel="noreferrer"
                leadingIcon={RiCodeSSlashLine}
              >
                GitHub
              </Action>
            </div>
          </div>
        </section>
        <section
          className="relative mx-auto mt-40 flex w-full max-w-[1276px] flex-col items-center px-3 sm:px-6 xl:px-0"
          aria-labelledby="bloom-faq"
        >
          <div className="flex w-full max-w-[555px] flex-col items-center gap-4 text-center">
            <h2
              id="bloom-faq"
              className="text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-balance text-text-primary sm:text-[48px] sm:leading-[53px] sm:tracking-[-0.96px]"
            >
              {text('faqTitle')}
            </h2>
            <p className="max-w-[465px] text-[16px] leading-[22px] font-medium text-pretty text-text-secondary">
              {text('faqDescription')}
            </p>
          </div>
          <div className="mt-[39px] flex w-full max-w-[760px] flex-col gap-[3px] rounded-[26px] bg-background-secondary-default p-[3px] dark:bg-background-primary-default">
            <Accordion
              type="single"
              value={faq}
              onValueChange={setFaq}
              style={{ gap: 3 }}
            >
              {['Install', 'Platforms', 'Theme', 'License'].map((key) => (
                <AccordionItem
                  value={key}
                  key={key}
                  style={{
                    borderRadius: 23,
                    overflow: 'hidden',
                    backgroundColor: 'var(--card)',
                    borderBottomWidth: 0,
                  }}
                >
                  <AccordionTrigger
                    style={{ paddingHorizontal: 23, paddingVertical: 21 }}
                    textStyle={{
                      fontSize: 17,
                      lineHeight: 24,
                      fontWeight: '500',
                    }}
                  >
                    {text(`q${key}`)}
                  </AccordionTrigger>
                  <AccordionContent style={{ paddingHorizontal: 19 }}>
                    <p className="pb-[5px] text-headline-regular text-text-secondary">
                      {text(`a${key}`)}
                    </p>
                    {key === 'License' && (
                      <a
                        href="https://github.com/OxyHQ/Bloom/blob/main/LICENSE"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Breathe License 1.0
                      </a>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="relative mt-[26px] flex w-full max-w-[760px] flex-col items-center gap-3 overflow-visible rounded-[26px] border border-border-button-default px-6 py-[22px] text-center sm:flex-row sm:justify-between sm:text-left">
            <span className="text-headline-medium">{text('docs')}</span>
            <Action secondary asChild>
              <Link to="/developers/docs/bloom/">{text('setup')}</Link>
            </Action>
          </div>
        </section>
        <section className="mx-auto flex w-full max-w-[1276px] flex-col items-center px-3 pt-16 pb-4 sm:px-6 sm:pt-20 xl:px-0">
          <div className="relative flex w-full max-w-[760px] flex-col items-center gap-6 overflow-hidden rounded-[26px] border border-border-button-default bg-background-primary-default px-6 py-10 text-center sm:px-10 sm:py-12">
            <div className="relative flex max-w-[520px] flex-col gap-2">
              <h2 className="text-[20px] leading-[26px] font-medium text-text-primary">
                {text('updatesTitle')}
              </h2>
              <p className="text-headline-regular text-text-secondary">
                {text('updatesDescription')}
              </p>
            </div>
            <Action secondary asChild>
              <Link to="/changelog/">{t('changelog.heading')}</Link>
            </Action>
          </div>
        </section>
        <section className="mx-auto mt-16 mb-16 flex w-full max-w-[1276px] flex-col items-center px-3 sm:mt-24 sm:mb-20 sm:px-6 xl:px-0">
          <div
            className="bloom-card-fan relative h-[332px] w-screen max-w-none shrink-0 [mask-image:linear-gradient(to_bottom,black_0%,black_66%,transparent_100%)]"
            data-spread={spread}
            aria-hidden
            inert
          >
            {(
              [
                'search',
                'progress',
                'limits',
                'thinking',
                'attachments',
              ] as const
            ).map((name, i) => (
              <div
                className="bloom-fan-card absolute bottom-0 left-1/2 -ml-[160px] h-[300px] w-[320px] rounded-[20px] border border-border-button-default bg-background-primary-default p-4 shadow-lg"
                style={{ '--fan-index': i - 2 } as CSSProperties}
                key={name}
              >
                <BloomPreview name={name} />
              </div>
            ))}
          </div>
          <div className="-mt-2 flex w-full max-w-[635px] flex-col items-center text-center sm:-mt-4">
            <Button
              appearance="outline"
              pressed={spread}
              onPress={() => setSpread(!spread)}
              style={{ marginBottom: 24 }}
            >
              {spread ? t('common.close') : t('common.seeAll')}
            </Button>
            <Heading
              title={text('closingTitle')}
              description={text('closingDescription')}
            />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Action asChild>
                <Link to={DOCS}>{text('components')}</Link>
              </Action>
            </div>
          </div>
        </section>
      </PageShell>
    </BloomLocaleProvider>
  )
}
