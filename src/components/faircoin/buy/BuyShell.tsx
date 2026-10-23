import type { ReactNode } from 'react';
import Button from '../cash/FairCoinButton';
import { fc } from '../../../lib/faircoin-links';
import '../cash/fonts.css';

interface BuyShellProps {
  title: string;
  subtitle?: string;
  steps: readonly { id: string; label: string }[];
  currentStep: number;
  children: ReactNode;
  footnote?: ReactNode;
}

/** Editorial FairCoin framing around the existing purchase state machine. */
export default function BuyShell({
  title,
  subtitle,
  steps,
  currentStep,
  children,
  footnote,
}: BuyShellProps) {
  return (
    <div
      data-faircoin-buy
      className="faircoin-editorial mx-auto max-w-[2600px] bg-card text-foreground [font-family:'FairCoin_Editorial',sans-serif] [--buy-banner-height:0px] [body:has(.site-banner)_&]:[--buy-banner-height:var(--site-header-banner-visible-height)] pt-[calc(var(--site-header-height)+var(--buy-banner-height)+32px)] min-[760px]:pt-[calc(var(--site-header-height)+var(--buy-banner-height)+48px)] lg:pt-[calc(var(--site-header-height)+var(--buy-banner-height)+64px)] [&_.bloom-btn]:!bg-none [&_.bloom-btn::after]:!bg-none [&_.bloom-btn::after]:!shadow-none"
    >
      <section aria-labelledby="buy-title" className="px-[5px] lg:px-5">
        <div className="mx-auto mb-7 max-w-[820px] px-4 text-center lg:mb-10">
          <h1
            id="buy-title"
            className="text-balance text-[clamp(36px,5vw,80px)] font-normal leading-[1.08] tracking-[-.015em]"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-[540px] text-balance text-[clamp(16px,1.4vw,21px)] leading-[1.4] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div className="faircoin-editorial-green relative isolate overflow-hidden rounded-[12px] bg-ring px-3 py-5 text-primary-foreground sm:px-6 sm:py-8 lg:rounded-[20px] lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[8%] top-[14%] hidden size-[36%] -rotate-12 bg-primary-foreground/5 [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat] lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-[9%] bottom-[5%] hidden size-[38%] rotate-12 bg-primary-foreground/5 [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat] lg:block"
          />
          <div className="relative mx-auto max-w-[540px]">
            <div className="faircoin-editorial overflow-hidden rounded-[20px] bg-card p-4 text-foreground sm:p-7 lg:p-8">
              <nav aria-label="Purchase progress" className="mb-6 border-b border-border pb-5">
                <ol className="flex items-center justify-between gap-3 text-sm">
                  {steps.map((step, index) => (
                    <li
                      key={step.id}
                      aria-current={index === currentStep ? 'step' : undefined}
                      className={`flex items-center gap-2 ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                      >
                        {index + 1}
                      </span>
                      <span>{step.label}</span>
                    </li>
                  ))}
                </ol>
              </nav>
              {children}
            </div>
            {footnote && (
              <p className="mx-auto mt-5 max-w-[460px] px-2 text-center text-xs leading-relaxed">
                {footnote}
              </p>
            )}
          </div>
        </div>
      </section>
      <section
        aria-labelledby="buy-how-title"
        className="mx-auto max-w-[1120px] px-5 py-14 lg:px-8 lg:py-24"
      >
        <h2
          id="buy-how-title"
          className="mb-8 text-balance text-[clamp(28px,3.2vw,46px)] leading-[1.08] tracking-[-.02em] lg:mb-12"
        >
          From Base to your wallet.
        </h2>
        <div className="grid gap-8 md:grid-cols-3 md:gap-10">
          {[
            [
              '01',
              'Choose your amount',
              'Enter how much FAIR you want and the native FairCoin address where you want to receive it.',
            ],
            [
              '02',
              'Pay with USDC',
              'Your quote gives you the payment amount, address and expiry. Send USDC on Base only.',
            ],
            [
              '03',
              'Follow your transfer',
              'Watch the bridge progress, then open the delivery transaction in the FairCoin explorer.',
            ],
          ].map(([number, heading, copy]) => (
            <div key={number}>
              <span className="mb-4 block text-sm text-muted-foreground">{number}</span>
              <h3 className="mb-3 text-[24px] leading-[1.1] tracking-[-.02em]">{heading}</h3>
              <p className="max-w-[330px] text-base leading-relaxed text-muted-foreground">
                {copy}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 md:flex-row md:items-center lg:mt-16">
          <p className="text-xl leading-tight">Your FairCoin. Your own wallet.</p>
          <div className="flex flex-wrap gap-3">
            <Button href={fc('/wallet/')}>Get FAIRWallet</Button>
            <Button href={fc('/bridge/')}>Explore the bridge</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
