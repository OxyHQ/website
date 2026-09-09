import type { ReactNode } from "react";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { formatNumber } from "../../lib/utils";
import type { PlatformStats } from "../../api/hooks";
import "../../styles/dashboard-metrics.css";

function Chevron({ circle = false }: { circle?: boolean }) {
  return (
    <span aria-hidden="true" className={`dashboard-chevron absolute flex items-center justify-center ${circle ? "rounded-full bg-muted text-foreground" : "text-muted-foreground"}`}>
      <svg width="100%" height="100%" viewBox="0 0 60 60" fill="none">
        <path d="m25 18 12 12-12 12" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Card({ title, children, circle, className = "" }: { title: string; children: ReactNode; circle?: boolean; className?: string }) {
  return (
    <section aria-label={title} className={`dashboard-metric relative isolate overflow-hidden bg-background ${className}`}>
      <h2 className="dashboard-card-title absolute font-medium tracking-[-0.035em] text-muted-foreground">{title}</h2>
      <Chevron circle={circle} />
      {children}
    </section>
  );
}

const marketPath = "M0 365 C5 370 9 377 14 378 S31 353 37 350 S53 365 58 364 S70 346 76 352 L93 376 Q97 382 103 372 Q108 365 113 376 Q116 381 121 373 L130 360 L137 309 Q141 297 146 315 L154 348 Q167 364 172 361 C177 357 178 322 185 322 S192 337 198 320 L209 290 Q213 280 218 289 L229 308 Q232 312 236 302 Q240 297 244 305 Q248 308 252 300 Q256 297 259 316 Q262 331 268 322 L276 310 Q279 306 286 311 L296 316 Q301 319 306 314 L315 308 L325 308 L342 297 L348 282 Q352 274 358 283 Q370 300 375 298 C381 294 387 273 392 276 S398 301 404 281 L412 258 Q418 241 421 282";
const volumePath = "M0 342 C10 350 17 365 25 360 L53 321 Q58 315 65 320 L82 337 Q88 342 94 335 L104 322 Q109 315 116 326 L139 357 Q145 366 151 356 Q158 340 166 352 Q173 369 181 356 L193 340 L204 261 Q207 246 214 254 L232 315 L252 334 Q259 339 263 327 L273 280 Q277 269 284 278 Q291 286 296 276 L316 222 Q321 210 328 224 L344 250 Q350 259 357 247 Q361 236 368 242 Q373 247 379 240 Q386 233 390 243 L396 270 Q400 280 407 272 L420 253 Q424 248 430 253 L449 264 Q454 268 459 263 L477 249 Q480 247 487 248 L498 248 L521 230 L529 212 Q534 200 542 216 C549 226 560 243 567 233 L585 207 Q591 194 597 200 L602 213 Q608 226 615 213 L627 177 Q633 169 638 181 L647 202";

function LineChart({ market = false }: { market?: boolean }) {
  const id = market ? "oxy-market" : "oxy-volume";
  const width = market ? 420 : 632;
  const path = market ? marketPath : volumePath;
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${width} 420`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={market ? "var(--success)" : "var(--primary)"} stopOpacity={market ? ".64" : ".19"} /><stop offset="100%" stopColor="var(--background)" stopOpacity="0" /></linearGradient>
      </defs>
      <path d={`${path} L${width} 420 L0 420 Z`} fill={`url(#${id}-fill)`} />
      <path d={path} fill="none" stroke={market ? "var(--success)" : "var(--primary)"} strokeWidth={market ? 4.3 : 3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const bars = [66, 145, 93, 145, 131, 93, 122, 158, 122, 158, 122, 93, 115, 145, 76, 122, 93, 122, 93, 158, 133, 145, 93];

export default function ReferenceMetricsGrid({ stats }: { stats: PlatformStats }) {
  const sessionShare = stats.totalUsers > 0 ? Math.min(100, (stats.activeSessions / stats.totalUsers) * 100) : 0;
  const transactionShare = stats.totalMessages + stats.totalTransactions > 0
    ? Math.min(100, (stats.totalTransactions / (stats.totalMessages + stats.totalTransactions)) * 100)
    : 0;
  const activityTotal = stats.totalMessages + stats.totalNotifications + stats.totalTransactions;

  return (
    <div className="dashboard-metrics-theme dashboard-metrics-dense mx-auto w-full [container-type:inline-size]">
      <div className="dashboard-reference-grid grid grid-cols-[420fr_420fr_420fr_420fr_632fr] gap-[.69cqw]">
        <Card title="Total Users" circle className="bg-surface">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.05em]">{formatNumber(stats.totalUsers)}</p>
          <p className="dashboard-market-change absolute flex items-center gap-[.6cqw] font-medium tracking-[-0.035em]"><span className="text-success">Oxy ID / <span className="text-muted-foreground">all apps</span></span><svg aria-hidden="true" className="w-[2.55cqw] text-success" viewBox="0 0 38 26" fill="none"><path d="m2 20 10-9 8 7L35 4M24 4h11v11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></p>
          <LineChart market />
        </Card>

        <Card title="Active Sessions">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.05em]">{formatNumber(stats.activeSessions)}</p>
          <div className="dashboard-allocation absolute">
            <div className="mb-[.5cqw] flex justify-between tracking-[-0.035em]"><span className="text-primary">Live {sessionShare.toFixed(1)}%</span><span className="text-muted-foreground">of users</span></div>
            <div role="img" aria-label={`${sessionShare.toFixed(1)}% of users have an active session`} className="flex h-[2.66cqw] overflow-hidden rounded-[.65cqw] bg-muted"><span style={{ width: `${sessionShare}%` }} className="border-r-[.3cqw] border-background bg-primary" /></div>
            <div className="mt-[1.55cqw] flex justify-between tracking-[-0.045em]"><span>0</span><span>{formatNumber(stats.totalUsers)}</span></div>
          </div>
        </Card>

        <Card title="Developer Apps">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.05em]">{formatNumber(stats.totalDeveloperApps)}</p>
          <p className="dashboard-subnet-change absolute font-medium tracking-[-0.04em]"><span className="text-primary">Connected / </span><span className="text-muted-foreground">Oxy API</span></p>
          <div className="dashboard-subnet-bars absolute flex items-center justify-between" aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <span key={index} className={`w-[.67cqw] rounded-[.25cqw] ${index < Math.min(stats.totalDeveloperApps, 19) ? "bg-primary" : "bg-muted"} h-[3.1cqw]`} />)}</div>
          <div className="dashboard-subnet-axis absolute flex justify-between tracking-[-0.03em] text-muted-foreground"><span>0</span><span>Apps</span><span>19+</span></div>
        </Card>

        <Card title="Stored Files">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.045em]">{formatNumber(stats.totalFiles)}</p>
          <p className="dashboard-subnet-change absolute font-medium tracking-[-0.04em]"><span className="text-primary">Private / </span><span className="text-muted-foreground">all apps</span></p>
          <div className="dashboard-subnet-bars absolute flex items-center justify-between" aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <span key={index} className={`w-[.47cqw] rounded-[.18cqw] ${index < Math.min(19, Math.ceil(stats.totalFiles / 100)) ? "bg-primary" : "bg-muted"} h-[2.15cqw]`} />)}</div>
          <div className="dashboard-subnet-axis absolute flex justify-between tracking-[-0.03em] text-muted-foreground"><span>0</span><span>Files</span><span>1.9K+</span></div>
        </Card>

        <Card title="Messages">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.05em]">{formatNumber(stats.totalMessages)}</p>
          <LineChart />
        </Card>

        <Card title="Notifications" circle>
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.045em]">{formatNumber(stats.totalNotifications)}</p>
          <p className="dashboard-subnet-change absolute font-medium tracking-[-0.04em]"><span className="text-primary">Delivered / </span><span className="text-muted-foreground">total</span></p>
          <div className="dashboard-subnet-bars absolute flex items-center justify-between" role="img" aria-label={`${stats.totalNotifications} notifications delivered`}>{Array.from({ length: 19 }, (_, index) => <span key={index} className={`w-[.85cqw] rounded-[.32cqw] ${index < Math.min(19, Math.ceil(stats.totalNotifications / 10)) ? "bg-primary" : "bg-muted"} ${index === Math.min(18, Math.ceil(stats.totalNotifications / 10) - 1) ? "h-[5.25cqw]" : "h-[3.92cqw]"}`} />)}</div>
          <div className="dashboard-subnet-axis absolute flex justify-between tracking-[-0.03em] text-muted-foreground"><span>0</span><span>Alerts</span><span>190+</span></div>
        </Card>

        <Card title="Transactions">
          <svg className="dashboard-donut absolute" viewBox="0 0 100 100" role="img" aria-label={`${transactionShare.toFixed(1)}% of message and transaction activity is transactions`}><circle cx="50" cy="50" r="37" fill="none" stroke="var(--border)" strokeWidth="22" /><circle cx="50" cy="50" r="37" pathLength="100" fill="none" stroke="var(--primary)" strokeWidth="22" strokeDasharray={`${Math.max(0, transactionShare - 2)} ${102 - transactionShare}`} transform="rotate(-90 50 50)" /></svg>
          <div className="dashboard-donut-legend absolute flex items-center justify-between text-muted-foreground tracking-[-0.04em]"><span className="flex items-center gap-[.35cqw]"><i className="inline-block h-[1.95cqw] w-[1cqw] rounded-full bg-border" />Messages</span><span className="flex items-center gap-[.35cqw]"><i className="inline-block h-[1.95cqw] w-[1cqw] rounded-full bg-primary" />Tx {formatNumber(stats.totalTransactions)}</span></div>
        </Card>

        <Card title="AI Models">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.045em]">{formatNumber(stats.aiModels)}</p>
          <p className="dashboard-subnet-change absolute font-medium tracking-[-0.04em]"><span className="text-primary">Available / </span><span className="text-muted-foreground">now</span></p>
          <div className="dashboard-subnet-bars absolute flex items-center justify-between" aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <span key={index} className={`w-[.67cqw] rounded-[.25cqw] ${index < stats.aiModels ? "bg-primary" : "bg-muted"} h-[3.1cqw]`} />)}</div>
          <div className="dashboard-subnet-axis absolute flex justify-between tracking-[-0.03em] text-muted-foreground"><span>0</span><span>Models</span><span>19</span></div>
        </Card>

        <Card title="Connections">
          <p className="dashboard-metric-value absolute font-bold tracking-[-0.045em]">{formatNumber(stats.totalFollows)}</p>
          <p className="dashboard-subnet-change absolute font-medium tracking-[-0.04em]"><span className="text-primary">Private graph / </span><span className="text-muted-foreground">total</span></p>
          <div className="dashboard-subnet-bars absolute flex items-center justify-between" aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <span key={index} className={`w-[.47cqw] rounded-[.18cqw] ${index < Math.min(19, Math.ceil(stats.totalFollows / 100)) ? "bg-primary" : "bg-muted"} h-[2.15cqw]`} />)}</div>
          <div className="dashboard-subnet-axis absolute flex justify-between tracking-[-0.03em] text-muted-foreground"><span>0</span><span>Follows</span><span>1.9K+</span></div>
        </Card>

        <Card title="Platform Activity">
          <div className="dashboard-trading-value absolute flex items-center gap-[1.6cqw]"><p className="font-bold tracking-[-0.05em]">{formatNumber(activityTotal)}</p><p className="dashboard-trading-month font-medium tracking-[-0.035em] text-muted-foreground">Live totals</p></div>
          <div className="dashboard-trading-bars absolute flex items-end justify-between" aria-hidden="true">{bars.map((height, index) => <span key={index} style={{ height: `${height / 158 * 100}%` }} className={`w-[1.33cqw] rounded-[.53cqw] ${index === 4 ? "bg-primary" : "bg-muted"}`} />)}</div>
          <div className="dashboard-trading-axis absolute flex justify-between font-medium tracking-[-0.04em] text-muted-foreground"><span>Messages</span><span>Alerts</span><span>Tx</span><span>Now</span></div>
        </Card>
      </div>
    </div>
  );
}
