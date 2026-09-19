import { Link } from '../../lib/navigation'
import Button from '../ui/Button'
import AvailabilityBadge from '../ai/platform/AvailabilityBadge'
import { useTranslation } from '../../lib/i18n'
import { OXY_INFERENCE_AVAILABILITY } from '../../data/ai/taxonomy'

/**
 * The homepage's AI section: two paths, not one pitch.
 *
 * The homepage stays ecosystem-wide — this is a section on it, not a takeover —
 * and it splits on the only distinction that matters to a visitor who lands
 * here: are you going to USE an AI product, or BUILD on the platform? Those
 * people need different pages, and the old copy ("Run AI models locally or
 * through Oxy's privacy-first cloud") answered neither while implying Oxy owns
 * every model it can reach.
 */
export default function HomeAiSection() {
  const { t } = useTranslation()

  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <div className="flex max-w-3xl flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t('ai.heroEyebrow')}
          </p>
          <h2 className="text-heading-responsive-md text-balance text-foreground">
            {t('ai.heroTitle')}
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">{t('ai.heroSubtitle')}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl text-foreground">{t('ai.sections.products')}</h3>
            <p className="flex-1 text-pretty text-muted-foreground">
              Alia is the assistant for people and teams. Codea is the coding and agent product.
              Both are built on the platform and sold on their own terms.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-foreground hover:bg-accent"
                href="https://alia.onl/"
                rel="noreferrer"
              >
                Alia
              </a>
              <Link
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-foreground hover:bg-accent"
                to="/codea"
              >
                Codea
              </Link>
            </div>
          </article>

          <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl text-foreground">{t('ai.sections.enterprise')}</h3>
              <AvailabilityBadge availability={OXY_INFERENCE_AVAILABILITY} />
            </div>
            <p className="flex-1 text-pretty text-muted-foreground">
              Oxy Inference is one API, one credential and one bill for every model Oxy is approved
              to serve. Managed and dedicated serving exist for the workloads that need the serving
              path itself to be known.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-foreground hover:bg-accent"
                to="/ai/inference"
              >
                {t('ai.inference.seoTitle')}
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-foreground hover:bg-accent"
                to="/enterprise"
              >
                {t('enterprisePage.seoTitle')}
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/ai" responsive>
            {t('ai.seoTitle')}
          </Button>
          <Button href="/ai/models" variant="outline" responsive>
            {t('ai.cta.exploreModels')}
          </Button>
        </div>
      </div>
    </section>
  )
}
