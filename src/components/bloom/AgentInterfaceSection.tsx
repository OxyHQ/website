import type { CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AgentAvatar } from '@oxy.so/bloom/agent-avatar';
import { Button } from '@oxy.so/bloom/button';
import { LocaleProvider } from '@oxy.so/bloom/locale';
import { BLOOM_AGENT_PRESETS } from '../../content/bloom-agent-presets';
import { useTranslation } from '../../lib/i18n';
import { Link } from '../../lib/navigation';
import BloomPreview from './BloomPreview';
import '../../styles/bloom-landing.css';

/** The same working agent demo, with each page's chosen preset presentation. */
export default function AgentInterfaceSection({
  presentation,
}: {
  presentation: 'presets' | 'decorative';
}) {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const showcase = presentation === 'presets';
  return (
    <LocaleProvider locale={locale}>
      <section
        id="multi-agent-chat"
        className={`${showcase ? 'bloom-landing ' : ''}mx-auto flex w-full max-w-[1276px] scroll-mt-20 flex-col items-center px-3 pt-40 pb-24 sm:px-6 sm:pt-48 sm:pb-32 xl:px-0`}
        aria-labelledby="bloom-agents"
      >
        <div className="flex w-full max-w-[640px] flex-col items-center text-center">
          {!showcase && (
            <div className="relative mb-6 flex h-28 w-40 items-center justify-center" aria-hidden>
              <div className="relative h-[104px] w-[120px]" data-agent-preset-marks>
                {[
                  [40, 0],
                  [0, 34],
                  [80, 34],
                  [40, 64],
                ].map(([left, top], index) => {
                  const preset = BLOOM_AGENT_PRESETS[index];
                  return (
                    <div
                      key={preset.name}
                      className="absolute"
                      style={{ left, top, transform: `rotate(${index % 2 ? 10 : -10}deg)` }}
                    >
                      <AgentAvatar
                        character={preset.character}
                        size={44}
                        paused={Boolean(reduce)}
                        label={preset.name}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex w-full max-w-[635px] flex-col items-center text-center">
            <h2
              id="bloom-agents"
              className="text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-balance text-text-primary sm:text-[48px] sm:leading-[53px]"
            >
              {t('bloom.agentsTitle')}
            </h2>
            <p className="mt-4 max-w-[570px] text-headline-medium text-pretty text-text-secondary">
              {t('bloom.agentsDescription')}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Button
              asChild
              appearance="outline"
              tone="neutral"
              className="bloom-landing-action h-9 rounded-2lg p-2"
              textVariant="headline-medium"
              textStyle={{ fontSize: 15, fontWeight: '500' }}
              style={{
                height: 36,
                borderRadius: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: 'var(--border)',
              }}
            >
              <Link to="/developers/docs/bloom/components/multi-agent-chat/">
                {t('bloom.docs')}
              </Link>
            </Button>
          </div>
        </div>
        {showcase && (
          <ul
            data-bloom-agent-presets
            aria-labelledby="bloom-agents"
            className="mt-10 grid w-full grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5 lg:grid-cols-9"
          >
            {BLOOM_AGENT_PRESETS.map((preset) => (
              <li key={preset.name} className="flex min-w-0 flex-col items-center gap-2">
                <AgentAvatar
                  character={preset.character}
                  size={96}
                  paused={Boolean(reduce)}
                  interactive={false}
                  label={preset.name}
                />
                <span className="text-body-medium text-text-secondary">{preset.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div
          className={`relative isolate w-full [--preview-inset:6px] sm:[--preview-inset:8px] ${showcase ? 'mt-10' : 'mt-16'}`}
          style={{ '--preview-radius': '31.45px' } as CSSProperties}
        >
          {!showcase &&
            BLOOM_AGENT_PRESETS.slice(2, 4).map((preset, index) => (
              <div
                key={preset.name}
                className={`pointer-events-none absolute -top-[85px] z-20 ${index === 0 ? 'left-5 sm:left-14' : 'right-5 sm:right-14'}`}
                aria-hidden
                data-agent-preset-decoration
              >
                <AgentAvatar
                  character={preset.character}
                  size={110}
                  paused={Boolean(reduce)}
                  label={preset.name}
                />
              </div>
            ))}
          <div className="relative z-10 rounded-[calc(var(--preview-radius)+var(--preview-inset)+1px)] border border-border-button-default bg-background-secondary-default p-1.5 shadow-lg sm:p-2">
            <BloomPreview name="multi-agent" />
          </div>
        </div>
      </section>
    </LocaleProvider>
  );
}
