import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { PromptInput } from '@oxyhq/bloom/prompt-input'
import HeroCanvas from './HeroCanvas'
import ParticleCanvas from './ParticleCanvas'
import ApiCardCanvas from './ApiCardCanvas'
import Logo from '../ui/Logo'
import Button from '../ui/Button'
import { useNewsroomPosts, usePromptPhrases } from '../../api/hooks'
import AIResearchSection from './AIResearchSection'
import {
  heroTagline, heroDescription, heroAnnouncementDesktop, heroAnnouncementMobile,
  heroAnnouncementHref, heroPlaceholder,
  productsTag, productsHeading, productCards,
  globeTextLeft, globeTextRight,
  blogTag, blogHeading, blogExploreCta, blogExploreHref, blogReadCta, blogEmptyText,
} from '../../data/ai'

const GlobeScene = lazy(() => import('./GlobeScene'))

/* ─────────────────────────────────────────────
   Icon SVGs
   ───────────────────────────────────────────── */

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="my-2 size-6">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.19l6.22-6.22a.75.75 0 1 1 1.06 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 1 1 1.06-1.06l6.22 6.22V3a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Product card SVGs — strokes use currentColor
   so they inherit from the page's text color
   ───────────────────────────────────────────── */

function AliaSvg({ fill = 'currentColor', stroke = 'none', strokeWidth = 0, opacity = 1, className }: { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number; className?: string }) {
  return (
    <svg className={className ?? 'w-full max-w-[320px] mx-auto'} viewBox="0 0 3410 1640">
      <g fill={fill} stroke={stroke} strokeWidth={strokeWidth || undefined} transform="translate(0,1640) scale(1,-1)" opacity={opacity}>
        <path d="M83 1484 c-21 -54 42 -209 114 -281 47 -47 165 -110 226 -119 20 -4 37 -10 37 -13 0 -4 -30 -33 -67 -65 -226 -195 -339 -418 -312 -614 16 -112 86 -209 188 -259 50 -25 66 -28 151 -27 62 1 111 7 140 18 127 47 293 183 399 326 l55 75 12 -55 c30 -148 79 -234 167 -294 88 -60 125 -69 282 -70 137 0 141 0 206 32 36 17 86 49 111 72 25 22 50 40 55 40 4 0 19 -24 33 -53 33 -69 90 -101 168 -93 69 6 124 34 192 95 30 28 58 50 62 51 4 0 10 -9 13 -21 10 -30 63 -87 99 -106 51 -27 168 -23 237 9 70 32 178 133 249 232 l54 76 18 -66 c10 -36 27 -82 37 -103 46 -89 175 -165 270 -159 l46 3 3 49 c5 74 -3 96 -35 96 -78 0 -153 75 -174 171 -16 75 4 220 48 339 53 145 54 134 -16 169 l-61 31 -20 -32 c-11 -18 -22 -37 -24 -43 -2 -5 -14 0 -27 12 -56 50 -109 68 -205 68 -85 0 -95 -2 -169 -39 -58 -29 -98 -58 -150 -110 -81 -82 -125 -153 -169 -269 -38 -101 -66 -147 -130 -215 -81 -86 -140 -105 -172 -56 -15 22 -16 34 -6 99 11 73 77 264 146 423 20 46 36 92 36 102 0 20 -116 69 -129 54 -7 -8 -87 -206 -162 -399 -53 -138 -233 -305 -328 -305 -73 0 -95 38 -95 165 l1 90 149 150 c165 166 261 292 329 432 56 115 79 200 70 262 -15 97 -54 134 -140 133 -127 -1 -253 -136 -381 -408 -118 -250 -176 -468 -178 -666 -1 -86 -5 -128 -12 -128 -28 0 -104 83 -126 138 -32 82 -32 288 1 412 31 119 93 285 157 418 39 83 51 118 45 130 -5 10 -30 37 -55 62 l-46 45 -88 -47 c-94 -50 -268 -123 -372 -156 -117 -37 -174 -47 -275 -47 -115 0 -180 18 -237 65 -39 32 -88 119 -88 156 0 28 -17 34 -91 34 -45 0 -61 -4 -66 -16z m1805 -170 c9 -76 -73 -240 -204 -409 -79 -102 -134 -156 -134 -131 0 24 80 226 125 317 73 145 167 267 199 256 6 -2 13 -17 14 -33z m-722 -94 c-10 -54 -117 -311 -176 -427 -82 -158 -169 -280 -266 -372 -104 -99 -187 -142 -284 -149 -86 -6 -132 14 -171 77 -25 38 -29 55 -29 113 0 220 208 444 590 635 105 53 326 152 339 153 2 0 1 -14 -3 -30z m1759 -415 c24 -13 45 -32 49 -41 8 -22 -77 -183 -151 -286 -99 -138 -202 -218 -281 -218 -148 0 -121 271 45 450 105 114 241 152 338 95z" />
        <path d="M2176 1259 c-58 -45 -72 -114 -31 -154 51 -52 149 -19 175 59 28 86 -71 152 -144 95z" />
      </g>
    </svg>
  )
}

function ApiSvg() {
  return (
    <svg className="h-auto w-full max-w-[360px] md:max-w-[488px] opacity-40 duration-100 group-hover:skew-y-[12deg] group-hover:scale-75 group-hover:opacity-70" viewBox="0 0 475 152" fill="none">
      <path d="m391.957 146.204-35.176-65.911a8.743 8.743 0 0 1 0-8.281l35.176-65.911c1.663-3.116 5.051-5.083 8.756-5.083h28.012c3.705 0 7.092 1.967 8.756 5.083l35.176 65.911a8.743 8.743 0 0 1 0 8.28l-35.176 65.912c-1.663 3.116-5.051 5.083-8.756 5.083h-28.012c-3.705 0-7.092-1.967-8.756-5.083Z" fill="var(--color-background)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="m395.445 149.833 39.724-73.683-39.724-73.683m77.347 73.68h-37.625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.4" />
      <path d="m316.99 146.204-35.176-65.911a8.743 8.743 0 0 1 0-8.281L316.99 6.101c1.663-3.116 5.051-5.083 8.756-5.083h28.013c3.704 0 7.092 1.967 8.755 5.083l35.176 65.911a8.738 8.738 0 0 1 0 8.28l-35.176 65.912c-1.663 3.116-5.051 5.083-8.755 5.083h-28.013c-3.705 0-7.092-1.967-8.756-5.083Z" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="m320.473 149.833 39.724-73.683-39.724-73.683m77.346 73.68h-37.625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.4" />
      <path d="m187.149 146.187-35.176-65.912a8.738 8.738 0 0 1 0-8.28l35.176-65.912C188.811 2.967 192.2 1 195.904 1h82.052c3.705 0 7.092 1.967 8.755 5.083l35.176 65.911a8.738 8.738 0 0 1 0 8.281l-35.176 65.912c-1.662 3.116-5.05 5.083-8.755 5.083h-82.052c-3.704 0-7.092-1.967-8.755-5.083Z" fill="var(--color-background)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <mask id="_S_1_" maskUnits="userSpaceOnUse" x="191" y="76" width="133" height="76" style={{ maskType: 'alpha' }}><path d="m230.357 76.14-38.243 70.927c-1.078 1.998.37 4.423 2.64 4.423h81.741a13 13 0 0 0 11.52-6.976l34.988-66.916a1 1 0 0 0-.886-1.463l-91.76.004Z" fill="#967E7E" /></mask>
      <g mask="url(#_S_1_)" stroke="currentColor" opacity="0.15">
        <path transform="scale(-1.02975 -.96934) rotate(-45 -13.924 264.465)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -17.347 272.73)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -20.768 280.988)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -24.192 289.253)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -27.615 297.519)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -31.035 305.775)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -34.457 314.035)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -37.88 322.3)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -41.3 330.556)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -44.722 338.819)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -48.147 347.086)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -51.57 355.35)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -54.987 363.6)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -58.413 371.871)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -61.832 380.125)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -65.253 388.384)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -68.677 396.65)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -72.096 404.906)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -75.518 413.166)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -78.946 421.441)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -82.364 429.693)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -85.786 437.956)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -89.21 446.22)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -92.633 454.485)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -96.05 462.737)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -99.474 471.002)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -102.898 479.267)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -106.32 487.528)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -109.742 495.789)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -113.164 504.05)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -116.585 512.312)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -120.007 520.572)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -123.429 528.833)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -126.85 537.091)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -130.272 545.354)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -133.695 553.618)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -137.116 561.877)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -140.538 570.138)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -143.963 578.408)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -147.381 586.66)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -150.804 594.922)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -154.229 603.19)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -157.65 611.452)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -161.07 619.708)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -164.49 627.964)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -167.916 636.234)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -171.336 644.49)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -174.758 652.753)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -178.18 661.014)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -181.602 669.275)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -185.023 677.534)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -188.445 685.795)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -191.865 694.053)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -195.29 702.321)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -198.716 710.591)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -202.134 718.845)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -205.554 727.101)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -208.981 735.375)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -212.4 743.63)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -215.82 751.884)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -219.246 760.157)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -222.665 768.41)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -226.089 776.676)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -229.512 784.94)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -232.934 793.2)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -236.353 801.457)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -239.777 809.722)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -243.198 817.98)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -246.62 826.241)" d="M0-.5h497.768" /><path transform="scale(-1.02975 -.96934) rotate(-45 -250.043 834.507)" d="M0-.5h497.768" />
      </g>
      <path d="m190.631 149.822 39.724-73.684-39.724-73.683M322.76 76.134h-92.408" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.4" />
      <path d="m187.149 146.187-35.176-65.912a8.738 8.738 0 0 1 0-8.28l35.176-65.912C188.811 2.967 192.2 1 195.904 1h82.052c3.705 0 7.092 1.967 8.755 5.083l35.176 65.911a8.738 8.738 0 0 1 0 8.281l-35.176 65.912c-1.662 3.116-5.05 5.083-8.755 5.083h-82.052c-3.704 0-7.092-1.967-8.755-5.083Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="M112.184 146.204 77.008 80.293a8.74 8.74 0 0 1 0-8.281l35.176-65.911c1.662-3.116 5.051-5.083 8.755-5.083h28.013c3.704 0 7.092 1.967 8.755 5.083l35.177 65.911a8.743 8.743 0 0 1 0 8.28l-35.177 65.912c-1.662 3.116-5.051 5.083-8.755 5.083h-28.013c-3.704 0-7.092-1.967-8.755-5.083Z" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="M115.666 149.833 155.39 76.15 115.666 2.467m77.346 73.68h-37.625" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.4" />
      <path d="M37.219 146.204 2.043 80.293a8.74 8.74 0 0 1 0-8.281L37.219 6.101c1.663-3.116 5.051-5.083 8.755-5.083h28.013c3.705 0 7.092 1.967 8.756 5.083l35.176 65.911a8.743 8.743 0 0 1 0 8.28l-35.176 65.912c-1.663 3.116-5.051 5.083-8.756 5.083H45.975c-3.705 0-7.093-1.967-8.756-5.083Z" fill="var(--color-background)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="m40.707 149.829 39.724-73.683L40.707 2.463m77.346 73.68H80.428" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.4" />
    </svg>
  )
}

function DocSvg({ className }: { className: string }) {
  return (
    <svg className={className} width="489" viewBox="0 0 489 382" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="1">
        <rect x="10.2715" y="30" width="432" height="357" fill="var(--color-background)" stroke="url(#paint2_linear_33868_17064)" />
        <line x1="55.6387" y1="97.6836" x2="394.812" y2="97.6836" stroke="currentColor" strokeOpacity="0.7" />
        <line x1="55.6387" y1="135.651" x2="394.812" y2="135.651" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="55.6387" y1="173.618" x2="394.812" y2="173.618" stroke="currentColor" strokeOpacity="0.5" />
        <line x1="55.6387" y1="211.585" x2="394.812" y2="211.585" stroke="currentColor" strokeOpacity="0.4" />
        <line x1="55.6387" y1="249.552" x2="394.812" y2="249.552" stroke="currentColor" strokeOpacity="0.3" />
        <line x1="55.6387" y1="287.52" x2="394.812" y2="287.52" stroke="currentColor" strokeOpacity="0.2" />
        <line x1="55.6387" y1="325.487" x2="394.812" y2="325.487" stroke="currentColor" strokeOpacity="0.1" />
      </g>
      <defs>
        <linearGradient id="paint2_linear_33868_17064" x1="226.271" y1="34" x2="226.271" y2="390" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" /><stop offset="0.8" stopColor="currentColor" stopOpacity="0" /></linearGradient>
      </defs>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Corner dots overlay for product cards
   ───────────────────────────────────────────── */

function CornerDots() {
  return (
    <div className="border-foreground/10 pointer-events-none absolute inset-0 isolate z-10 border opacity-0 group-hover:opacity-100 hidden lg:block">
      <div className="bg-foreground absolute -left-1 -top-1 z-10 size-2 -translate-x-px -translate-y-px" />
      <div className="bg-foreground absolute -right-1 -top-1 z-10 size-2 translate-x-px -translate-y-px" />
      <div className="bg-foreground absolute -bottom-1 -left-1 z-10 size-2 -translate-x-px translate-y-px" />
      <div className="bg-foreground absolute -bottom-1 -right-1 z-10 size-2 translate-x-px translate-y-px" />
    </div>
  )
}

/* ─────────────────────────────────────────────
   Date formatter
   ───────────────────────────────────────────── */

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
}

/* ═══════════════════════════════════════════════
   MAIN PAGE CONTENT
   ═══════════════════════════════════════════════ */

export default function AIPageContent() {
  const [scrollY, setScrollY] = useState(0)
  const [promptValue, setPromptValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { data: newsData } = useNewsroomPosts({ tag: 'ai', limit: 3 })
  const articles = newsData?.posts ?? []
  const { data: promptPhrases } = usePromptPhrases('ai')
  const currentPlaceholder = promptPhrases?.length ? promptPhrases[Math.floor(Date.now() / 5000) % promptPhrases.length] : heroPlaceholder

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = promptValue.trim()
    if (!trimmed || isLoading) return
    setIsLoading(true)
    setTimeout(() => { setIsLoading(false); setPromptValue('') }, 1500)
  }, [promptValue, isLoading])

  return (
    <>
      {/* ═══ SECTION 1: Hero ═══ */}
      <div className="page-hero border-border relative h-svh w-full overflow-hidden border-b pb-px md:overflow-x-hidden force-dark bg-background text-foreground">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-cover bg-center bg-blend-darken" style={{ backgroundImage: 'url(/ai/hero-bg.png)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="opacity-50"><AliaSvg fill="none" stroke="currentColor" strokeWidth={14} /></div>
          </div>
          <HeroCanvas />
          <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl flex h-full flex-col">
            <div className="relative z-20 mt-20 flex h-full w-full items-center">
              <hgroup className="space-y-8">
                <div className="absolute inset-0 top-20 flex grow items-end justify-center">
                  <div className="w-full max-w-3xl">
                    <div className="relative w-full items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-tr p-px from-primary/5 to-primary/20">
                      <PromptInput
                        value={promptValue}
                        onValueChange={setPromptValue}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        onStop={() => setIsLoading(false)}
                        placeholder={currentPlaceholder}
                        maxHeight={160}
                        style={{ minHeight: 48 }}
                        disableKeyboardAvoidance
                      />
                    </div>
                  </div>
                </div>
              </hgroup>
            </div>

            {/* Bottom bar */}
            <div className="relative z-10 flex items-end justify-between gap-6 pb-4 pt-4 lg:min-h-[160px] lg:py-10">
              <button type="button" onClick={() => document.getElementById('ai-products')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer" aria-label="Scroll to products">
                <ArrowDownIcon />
              </button>
              <div className="flex flex-col items-end gap-6 sm:gap-8 md:flex-row lg:gap-12">
                <div className="max-w-2xl">
                  <div className="hidden max-w-lg lg:block">{heroTagline}<br /> {heroDescription}</div>
                </div>
                <div className="flex flex-col items-end gap-3 sm:flex-row">
                  <Button variant="outline" size="sm" href={heroAnnouncementHref} className="hidden lg:inline-flex">
                    {heroAnnouncementDesktop} <ArrowUpRightIcon className="size-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" href={heroAnnouncementHref} className="lg:hidden">
                    {heroAnnouncementMobile} <ArrowUpRightIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: Products ═══ */}
      <section id="ai-products" className="py-16 sm:py-32">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl space-y-16 sm:space-y-32">
          <div>
            <div className="mono-tag flex items-center gap-2 text-sm text-muted-foreground"><span>[ </span><span> {productsTag} </span><span> ]</span></div>
            <h1 className="text-balance text-3xl tracking-tight md:text-4xl lg:text-5xl mt-4 text-foreground">{productsHeading}</h1>
          </div>
          <div className="grid gap-0 lg:grid-cols-3 lg:-space-x-px">
            {/* Card 1: Oxy Chat */}
            <div className="group relative flex h-full flex-col space-y-4 px-0 py-10 lg:p-8 from-secondary/10 border-border border-t via-transparent to-transparent lg:border-l lg:border-t-0 lg:hover:bg-gradient-to-b gap-10 overflow-hidden md:flex-row lg:flex-col">
              <CornerDots />
              <a href={productCards[0].href} aria-label={productCards[0].title}><span className="absolute inset-0" /></a>
              <div className="flex flex-col gap-3 lg:gap-4">
                <h3 className="text-xl leading-6 text-foreground">{productCards[0].title}</h3>
                <p className="text-muted-foreground text-balance">{productCards[0].description}</p>
              </div>
              <div className="pointer-events-none flex-1 flex items-end justify-center opacity-75">
                <div className="origin-bottom opacity-40 duration-100 group-hover:scale-110 group-hover:opacity-70">
                  <AliaSvg opacity={0.35} />
                </div>
              </div>
              <Button variant="outline" size="sm" className="pointer-events-none w-fit mt-auto group-hover:bg-surface">
                {productCards[0].cta} <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </div>
            {/* Card 2: API */}
            <div className="group relative flex h-full flex-col space-y-4 px-0 py-10 lg:p-8 from-secondary/10 border-border border-t via-transparent to-transparent lg:border-l lg:border-t-0 lg:hover:bg-gradient-to-b gap-10 overflow-hidden md:flex-row lg:flex-col">
              <CornerDots />
              <a href={productCards[1].href} aria-label={productCards[1].title}><span className="absolute inset-0" /></a>
              <div className="flex flex-col gap-3 lg:gap-4">
                <h3 className="text-xl leading-6 text-foreground">{productCards[1].title}</h3>
                <p className="text-muted-foreground text-balance">{productCards[1].description}</p>
              </div>
              <div className="relative flex-1 flex items-end justify-center">
                <div className="absolute inset-0 -inset-x-8 flex items-center justify-center opacity-0 duration-100 group-hover:opacity-100">
                  <ApiCardCanvas className="h-full w-full" />
                </div>
                <ApiSvg />
              </div>
              <Button variant="outline" size="sm" className="pointer-events-none w-fit mt-auto group-hover:bg-surface">
                {productCards[1].cta} <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </div>
            {/* Card 3: Developer Docs */}
            <div className="group relative flex h-full flex-col space-y-4 px-0 py-10 lg:p-8 from-secondary/10 border-border border-t via-transparent to-transparent lg:border-l lg:border-t-0 lg:hover:bg-gradient-to-b gap-10 overflow-hidden md:flex-row lg:flex-col">
              <CornerDots />
              <a href={productCards[2].href} aria-label={productCards[2].title}><span className="absolute inset-0" /></a>
              <div className="flex flex-col gap-3 lg:gap-4">
                <h3 className="text-xl leading-6 text-foreground">{productCards[2].title}</h3>
                <p className="text-muted-foreground text-balance">{productCards[2].description}</p>
              </div>
              <div className="relative flex-1 flex items-end mt-2 opacity-40 duration-100 group-hover:opacity-70">
                <DocSvg className="w-full absolute -right-8 -top-8 duration-100 group-hover:translate-x-4 group-hover:rotate-3" />
                <DocSvg className="w-full absolute -right-4 -top-4" />
                <DocSvg className="w-full relative duration-100 group-hover:-translate-x-4 group-hover:-rotate-3" />
              </div>
              <Button variant="outline" size="sm" className="pointer-events-none w-fit mt-auto group-hover:bg-surface">
                {productCards[2].cta} <ArrowUpRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: Globe + Mission Text ═══ */}
      <div className="relative">
        <div className="mx-auto h-[600px] lg:h-[1000px] xl:h-[1200px]">
          <Suspense fallback={<div className="h-full" />}>
            <GlobeScene className="h-full w-full" />
          </Suspense>
        </div>

        <div className="pointer-events-none absolute inset-6 flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-7xl">
            <div style={{ transform: `translateX(${50 - scrollY * 0.03}px)` }} className="from-foreground/40 to-foreground inline-block text-balance bg-gradient-to-l bg-clip-text py-2 text-4xl leading-[2.25rem] tracking-tight text-transparent md:text-[5rem] md:leading-[5rem]">
              {globeTextLeft}
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-7xl justify-end">
            <div style={{ transform: `translateX(${-50 + scrollY * 0.03}px)` }} className="from-foreground/40 to-foreground inline-block text-balance bg-gradient-to-r bg-clip-text py-2 text-4xl leading-[2.25rem] tracking-tight text-transparent md:text-[5rem] md:leading-[5rem]">
              {globeTextRight}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 4: AI for Research ═══ */}
      <section className="py-16 sm:py-32 relative overflow-hidden">
        {/* Particle canvas */}
        <div className="absolute inset-0 -top-16 sm:-top-32" style={{ mask: 'radial-gradient(circle at center, black, transparent)', WebkitMask: 'radial-gradient(circle at center, black, transparent)' }}>
          <ParticleCanvas className="h-full w-full" />
        </div>

        {/* Horizontal glow line */}
        <div className="absolute inset-x-0 -top-16 h-px bg-gradient-to-r from-transparent via-foreground to-transparent opacity-40 sm:-top-32" />

        {/* Color glow overlay */}
        <div
          className="absolute -inset-x-[200px] -top-16 h-[500px] sm:-top-32 lg:-inset-x-[400px]"
          style={{
            background: 'linear-gradient(to right, rgba(255, 99, 8, 0.1), rgba(255, 99, 8, 0.1), rgba(189, 201, 230, 0.1), rgba(151, 196, 255, 0.1), rgba(151, 196, 255, 0.1))',
            mask: 'radial-gradient(ellipse at top, black, transparent 60%)',
            WebkitMask: 'radial-gradient(ellipse at top, black, transparent 60%)',
          }}
        />

        <AIResearchSection />
      </section>

      {/* ═══ SECTION 5: Blog / News (exact xAI structure, real data) ═══ */}
      <section className="py-16 sm:py-32">
        <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl space-y-16 sm:space-y-32">
          {/* Header */}
          <div className="space-y-12">
            <div>
              <div className="mono-tag flex items-center gap-2 text-sm text-muted-foreground"><span>[ </span><span> {blogTag} </span><span> ]</span></div>
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-12">
                <h2 className="text-balance text-3xl tracking-tight md:text-4xl lg:text-5xl text-foreground">{blogHeading}</h2>
              </div>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-12">
                <div>
                  <Button variant="outline" size="md" href={blogExploreHref}>
                    {blogExploreCta}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div>
            {articles.map((article) => (
              <div key={article.slug} className="group relative">
                <div className="border-border flex flex-col gap-10 border-b py-16 first-of-type:border-t last-of-type:border-b-0 md:flex-row md:gap-12">
                  <div className="order-2 flex flex-1 flex-col gap-4 md:order-1 md:gap-12 xl:flex-row">
                    <div>
                      <p className="mono-tag text-xs leading-6 text-muted-foreground">{formatDate(article.publishedAt)}</p>
                    </div>
                    <div className="flex flex-1 flex-col space-y-6">
                      <div className="block grow space-y-4">
                        <a href={`/newsroom/${article.slug}`} aria-label={article.title}>
                          <span className="absolute inset-0" />
                          <h3 className="text-xl leading-6 text-foreground">{article.title}</h3>
                        </a>
                        <p className="text-muted-foreground grow text-balance">{article.resume}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div><span className="mono-tag text-xs text-muted-foreground">{article.tags?.[0] || article.categories?.[0] || 'ai'}</span></div>
                        <div>
                          <Button variant="outline" size="sm" className="pointer-events-none group-hover:bg-surface">
                            {blogReadCta}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 flex-1 md:order-2 xl:max-w-[500px]">
                    <div
                      className="break-words flex w-full items-center whitespace-pre-wrap bg-surface duration-150 aspect-[16/10] text-4xl leading-[2.5rem] tracking-tight"
                      style={{
                        backgroundImage: article.coverImage ? `url(${article.coverImage})` : 'none',
                        backgroundSize: 'auto 100%',
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {!article.coverImage && (
                        <div className="flex h-full w-full items-center justify-center">
                          <Logo className="h-12 w-auto text-foreground/10" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <p className="text-muted-foreground py-16 text-center">{blogEmptyText}</p>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Floating header gradient (scroll-triggered) ═══ */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-32 bg-gradient-to-b from-background duration-200 lg:h-24 lg:from-background/75"
        style={{ opacity: Math.min(scrollY / 200, 1) }}
      />
    </>
  )
}
