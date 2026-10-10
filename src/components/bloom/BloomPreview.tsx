import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ErrorBoundary } from '@oxy.so/bloom/error-boundary';
import { useTranslation } from '../../lib/i18n';

const BloomDemos = lazy(() => import('./BloomDemos'));
export type BloomDemoName =
  | 'template-chat'
  | 'template-dashboard'
  | 'template-health'
  | 'template-projects'
  | 'template-profile'
  | 'multi-agent'
  | 'project-board'
  | 'widgets'
  | 'image'
  | 'accounts'
  | 'models'
  | 'segments'
  | 'checks'
  | 'patient'
  | 'steps'
  | 'sleep'
  | 'days'
  | 'activity'
  | 'alerts'
  | 'calendar'
  | 'calendar-view'
  | 'controls'
  | 'upload'
  | 'table'
  | 'profile'
  | 'ai-profile'
  | 'sidebar'
  | 'progress'
  | 'auth'
  | 'auth-signup'
  | 'attachments'
  | 'search'
  | 'limits'
  | 'thinking'
  | 'meeting'
  | 'chat'
  | 'loader'
  | 'loader-feature'
  | 'funnel'
  | 'earnings'
  | 'revenue'
  | 'radar'
  | 'comparison'
  | 'sankey'
  | 'stages'
  | 'radial'
  | 'gauge'
  | 'area'
  | 'combo';

/** Mount near the viewport; pass visibility to Bloom's animation controls. */
export default function BloomPreview({
  name,
  className = '',
}: {
  name: BloomDemoName;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();
  const { t } = useTranslation();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          preload.disconnect();
        }
      },
      { rootMargin: '240px' },
    );
    const viewport = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting));
    preload.observe(node);
    viewport.observe(node);
    return () => {
      preload.disconnect();
      viewport.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={`bloom-preview ${className}`} data-bloom-preview={name}>
      <ErrorBoundary
        fallback={<p className="bloom-preview-fallback">{t('common.somethingWentWrong')}</p>}
      >
        <Suspense
          fallback={<div className="bloom-preview-placeholder" aria-label={t('common.loading')} />}
        >
          {ready ? (
            <BloomDemos
              name={name}
              active={visible && (!reduce || name === 'loader' || name === 'loader-feature')}
            />
          ) : (
            <div className="bloom-preview-placeholder" />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
