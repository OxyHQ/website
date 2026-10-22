import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { AlertDialog } from '@oxy.so/bloom/alert-dialog';
import { AnimatedTitle } from '../ui/AnimatedTitle';
import { APP_CARD_IMAGES } from '../../data/appCardImages';
import { useTranslation } from '../../lib/i18n';

export default function CommonsAppSection() {
  const { t } = useTranslation();
  const [iosSoonOpen, setIosSoonOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // The backdrop is 140% tall and starts 20% above the band, so a ±8% drift of
  // its own height still leaves it covering the band edge to edge.
  const backdropY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  // The phone only ever moves DOWN from its resting position. Lifting it would
  // raise the photo's hard bottom edge into the band and show the cut.
  const phoneY = useTransform(scrollYProgress, [0, 1], ['22%', '0%']);

  return (
    <section ref={ref} className="force-dark relative isolate overflow-hidden">
      <motion.img
        src={'/images/landing/commons-night.webp'}
        alt=""
        aria-hidden="true"
        style={reduce ? undefined : { y: backdropY }}
        className="-z-20 absolute -top-[20%] left-0 h-[140%] w-full object-cover"
        width={1794}
        height={877}
        loading="lazy"
        decoding="async"
      />
      {/* The illustration is busiest on the left, where the copy sits. The
          band is a night scene in either theme, so it takes the `.force-dark`
          palette and the scrim is that palette's background. */}
      <div className="-z-10 absolute inset-0 bg-linear-to-r from-background/88 via-background/72 via-45% to-background/35 max-lg:bg-linear-to-b max-lg:from-background/85 max-lg:via-background/60 max-lg:via-60% max-lg:to-background/85" />

      {/* No bottom padding on the right: the phone is meant to rise out of the
          band's lower edge rather than float in the middle of it. */}
      <div className="container pt-20 lg:pt-28">
        <div className="grid grid-cols-12 items-end gap-6">
          <div className="col-span-full pb-20 text-foreground max-lg:text-center lg:col-span-5 lg:pb-28">
            <AnimatedTitle
              as="h2"
              className="mb-5 text-heading-responsive-lg lg:text-[4rem] lg:leading-[1.05]"
            >
              {t('home.commonsTitle')}
            </AnimatedTitle>
            <p className="max-w-[500px] text-lg leading-relaxed opacity-80 lg:text-xl max-lg:mx-auto">
              {t('home.commonsDescription')}
            </p>

            <div className="mt-10 flex flex-col gap-5 max-lg:items-center lg:mt-12">
              <p className="max-w-[530px] font-[450] text-[13px] leading-relaxed tracking-wide">
                <span className="opacity-60">{t('home.commonsDetails')}</span>{' '}
                {t('home.commonsFree')}
              </p>
              {/* Official store artwork, served as files. Commons is live on
                  Google Play; there is no iOS listing yet, so the App Store
                  badge says so instead of sending people to a dead end.
                  The black behind each badge is Apple's and Google's own badge
                  colour (their guidelines forbid recolouring), not a theme one. */}
              <div className="flex flex-wrap items-center gap-3 max-lg:justify-center">
                <button
                  type="button"
                  onClick={() => setIosSoonOpen(true)}
                  aria-label={t('home.appStore')}
                  className="inline-flex w-fit cursor-pointer overflow-hidden rounded-full border-0 bg-black leading-none transition-opacity hover:opacity-80"
                >
                  <img
                    className="block"
                    src="/images/badges/app-store.svg"
                    alt={t('home.appStore')}
                    width={128}
                    height={38}
                  />
                </button>
                <a
                  href="https://play.google.com/store/apps/details?id=so.oxy.commons"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('home.googlePlay')}
                  className="inline-flex w-fit overflow-hidden rounded-full border-0 bg-black leading-none transition-opacity hover:opacity-80"
                >
                  <img
                    className="block"
                    src="/images/badges/google-play.svg"
                    alt={t('home.googlePlay')}
                    width={128}
                    height={38}
                  />
                </a>
              </div>
            </div>
            <AlertDialog
              open={iosSoonOpen}
              onOpenChange={setIosSoonOpen}
              title={t('home.commonsIosSoonTitle')}
              description={t('home.commonsIosSoonBody')}
              confirmLabel={t('common.close')}
              hideCancel
            />
          </div>

          <motion.div
            style={reduce ? undefined : { y: phoneY }}
            className="col-span-full self-end max-lg:mt-4 lg:col-span-6 lg:col-start-7"
          >
            <img
              src={APP_CARD_IMAGES['/commons']}
              alt={t('home.commonsImageAlt')}
              className="mx-auto h-auto w-full max-w-[320px] object-contain drop-shadow-[0_30px_60px_color-mix(in_srgb,var(--background)_45%,transparent)] sm:max-w-[440px] lg:max-w-none"
              width={577}
              height={433}
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
