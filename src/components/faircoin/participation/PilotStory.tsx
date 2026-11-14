import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from '../../../lib/navigation';
import { useTranslation } from '../../../lib/i18n';
import { useParticipationHref } from './shared';
import './pilot-story.css';

/** The wrapper remains stationary so transformed content cannot affect scroll progress. */
function ScrollReveal({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 55%'] });
  const y = useTransform(scrollYProgress, [0, 1], [72, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.75, 1], [0.2, 1, 1]);
  return (
    <div ref={ref} className={className} data-pilot-reveal>
      <motion.div style={reduced ? undefined : { y, opacity }}>{children}</motion.div>
    </div>
  );
}

function Photograph({ scene, eager = false }: { scene: 'repair' | 'bakery'; eager?: boolean }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [1.32, 1.18, 1.24]);
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.35],
    ['inset(14% 12% 14% 12% round 32px)', 'inset(0% 0% 0% 0% round 32px)'],
  );
  return (
    <figure ref={ref} className="pilot-photograph">
      <motion.div className="pilot-photo-crop" style={reduced || eager ? undefined : { clipPath }}>
        <motion.img
          src={
            scene === 'repair'
              ? '/faircoin/pilot/repair-workshop.webp'
              : '/faircoin/pilot/bakery.webp'
          }
          alt={t(`faircoinParticipation.${scene}ImageAlt`)}
          width={1000}
          height={scene === 'repair' ? 1500 : 949}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          style={reduced ? undefined : { y, scale }}
        />
      </motion.div>
      <figcaption>
        {t(
          `faircoinParticipation.${scene === 'repair' ? 'illustrativeImage' : 'illustrativePhoto'}`,
        )}
      </figcaption>
    </figure>
  );
}

function ProposalMap() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'center 50%'] });
  const left = useTransform(scrollYProgress, [0, 1], [-16, 0]);
  const right = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const rise = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const offerY = useTransform(scrollYProgress, [0, 1], [64, 0]);
  const needsY = useTransform(scrollYProgress, [0, 1], [136, 0]);
  const offerRotate = useTransform(scrollYProgress, [0, 1], [-7, 0]);
  const needsRotate = useTransform(scrollYProgress, [0, 1], [7, 0]);
  return (
    <div ref={ref} className="pilot-proposal-map">
      <p className="pilot-map-label">{t('faircoinParticipation.projectGroup')}</p>
      <motion.div
        className="pilot-map-tile bg-background"
        style={reduced ? undefined : { x: left, y: offerY, rotate: offerRotate }}
      >
        <span aria-hidden="true">01</span>
        <h3>{t('faircoinParticipation.offering')}</h3>
        <p>
          {t('faircoinParticipation.capacity')} · {t('faircoinParticipation.availability')}
        </p>
      </motion.div>
      <motion.div
        className="pilot-map-tile bg-primary text-primary-foreground"
        style={reduced ? undefined : { x: right, y: needsY, rotate: needsRotate }}
      >
        <span aria-hidden="true">02</span>
        <h3>{t('faircoinParticipation.needs')}</h3>
        <p>
          {t('faircoinParticipation.remote')} · {t('faircoinParticipation.local')}
        </p>
      </motion.div>
      <motion.div className="pilot-map-result" style={reduced ? undefined : { y: rise }}>
        <span aria-hidden="true">↓</span>
        <p>{t('faircoinParticipation.conditions')}</p>
      </motion.div>
    </div>
  );
}

function Chapter({
  step,
  children,
  visual,
  dark = false,
}: {
  step: 'match' | 'agree';
  children: ReactNode;
  visual: ReactNode;
  dark?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section
      id={`pilot-${step}`}
      data-pilot-tone={dark ? 'dark' : 'light'}
      aria-labelledby={`pilot-${step}-title`}
      className={`pilot-section ${dark ? 'faircoin-editorial-dark bg-primary-foreground text-foreground' : 'faircoin-editorial bg-card text-foreground'}`}
    >
      <div className="pilot-grid">
        <ScrollReveal className="pilot-heading">
          <p className="pilot-eyebrow" aria-hidden="true">
            {step === 'match' ? '01' : '02'} / 03
          </p>
          <h2 id={`pilot-${step}-title`}>{t(`faircoinParticipation.${step}Title`)}</h2>
        </ScrollReveal>
        <div className="pilot-visual">{visual}</div>
        <ScrollReveal className="pilot-copy">
          <div className="pilot-copy">{children}</div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/** Public narrative; no application data or intake API is requested here. */
export default function PilotStory({ onToneChange }: { onToneChange: (dark: boolean) => void }) {
  const { t } = useTranslation();
  const href = useParticipationHref();
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const sections = root.current?.querySelectorAll<HTMLElement>('[data-pilot-tone]');
    if (!sections) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const header = document.querySelector('header')?.getBoundingClientRect();
      const sample = header ? (header.top + header.bottom) / 2 : 48;
      const active = Array.from(sections).find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= sample + 1 && rect.bottom > sample;
      });
      onToneChange(active?.dataset.pilotTone === 'dark');
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [onToneChange]);
  const apply = (
    <Link className="pilot-action" to={href('/participate/')}>
      {t('faircoinParticipation.propose')}
      <span aria-hidden="true">↗</span>
    </Link>
  );
  return (
    <div ref={root} className="pilot-story">
      <section
        className="pilot-hero faircoin-editorial-green bg-ring text-primary-foreground"
        data-pilot-tone="light"
        aria-labelledby="pilot-title"
      >
        <div className="pilot-grid">
          <h1 id="pilot-title" className="pilot-heading">
            {t('faircoinParticipation.pilotTitle')}
          </h1>
          <div className="pilot-visual">
            <Photograph scene="repair" eager />
          </div>
          <div className="pilot-copy">
            <p>{t('faircoinParticipation.body')}</p>
            {apply}
            <p className="pilot-state">{t('faircoinParticipation.state')}</p>
            <a className="pilot-method-link" href="#pilot-match">
              {t('faircoinParticipation.how')} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>
      <Chapter step="match" visual={<ProposalMap />}>
        <p>{t('faircoinParticipation.matchBody')}</p>
        <p className="pilot-secondary-copy">{t('faircoinParticipation.noApproval')}</p>
      </Chapter>
      <Chapter step="agree" dark visual={<Photograph scene="bakery" />}>
        <p>{t('faircoinParticipation.agreeBody')}</p>
        <p className="pilot-secondary-copy">{t('faircoinParticipation.participateDescription')}</p>
      </Chapter>
      <section
        className="pilot-section pilot-review faircoin-editorial bg-card text-foreground"
        data-pilot-tone="light"
        aria-labelledby="pilot-review-title"
      >
        <div className="pilot-grid">
          <ScrollReveal className="pilot-heading">
            <p className="pilot-eyebrow" aria-hidden="true">
              03 / 03
            </p>
            <h2 id="pilot-review-title">{t('faircoinParticipation.reviewTitle')}</h2>
          </ScrollReveal>
          <ScrollReveal className="pilot-review-body">
            <p>{t('faircoinParticipation.reviewBody')}</p>
          </ScrollReveal>
        </div>
        <div className="pilot-privacy-grid">
          {(['privacy', 'publication', 'contact'] as const).map((item, index) => (
            <motion.div
              key={item}
              initial={false}
              whileInView={reduced ? undefined : { y: [24, 0] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="pilot-privacy-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>
                {t(
                  `faircoinParticipation.${item === 'privacy' ? 'privacyTitle' : item === 'publication' ? 'publicationTitle' : 'dataTitle'}`,
                )}
              </h3>
              <p>
                {t(
                  `faircoinParticipation.${item === 'privacy' ? 'privacyBody' : item === 'publication' ? 'publicationBody' : 'privacyWarning'}`,
                )}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      <section
        className="pilot-section pilot-ending faircoin-editorial-dark bg-primary-foreground text-foreground"
        data-pilot-tone="dark"
      >
        <div className="pilot-grid">
          <h2>{t('faircoinParticipation.title')}</h2>
          <div className="pilot-ending-copy">
            <p>{t('faircoinParticipation.participateDescription')}</p>
            <div className="pilot-ending-actions">
              {apply}
              <a href="mailto:oxy@oxy.so">oxy@oxy.so ↗</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
