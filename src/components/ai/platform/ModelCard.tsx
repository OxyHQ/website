import { Link } from '../../../lib/navigation'
import { useTranslation } from '../../../lib/i18n'
import { modelPath } from '../../../lib/ai/modelId'
import { displayPrice, isPerMillionUnit } from '../../../lib/ai/estimator'
import {
  publisherName,
  regionsForEntry,
  type CatalogEntry,
  type PublicCatalog,
} from '../../../lib/ai/catalog'
import AvailabilityBadge from './AvailabilityBadge'

/**
 * One catalogue entry, as a card.
 *
 * A routing profile gets a different type chip and an explicit note, because
 * the one confusion this catalogue has to avoid is a policy being read as a
 * model. Everything else on the card is catalogue data or absent — there is no
 * branch here that supplies a default price, a default region or a default
 * policy when the entry does not carry one.
 */
export default function ModelCard({
  catalog,
  entry,
}: {
  catalog: PublicCatalog
  entry: CatalogEntry
}) {
  const { t } = useTranslation()
  const href = modelPath(entry.id)
  const regions = regionsForEntry(catalog, entry)
  const inputPrice = entry.prices.find((price) => price.unit === 'input_token')
  const outputPrice = entry.prices.find((price) => price.unit === 'output_token')
  const isProfile = entry.kind === 'routing_profile'

  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${
            isProfile
              ? 'border-dashed border-primary/50 text-primary-text'
              : 'border-border text-muted-foreground'
          }`}
        >
          {isProfile ? t('ai.models.typeRoutingProfile') : t('ai.models.typeModel')}
        </span>
        <AvailabilityBadge availability={entry.availability} />
      </div>

      <div>
        <h3 className="text-lg text-foreground">
          {href ? (
            <Link to={href} className="underline-offset-4 hover:underline">
              <span className="absolute inset-0" aria-hidden="true" />
              {entry.name}
            </Link>
          ) : (
            entry.name
          )}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{entry.id}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        {publisherName(catalog, entry.publisherId)}
      </p>
      <p className="line-clamp-3 text-pretty text-sm text-foreground/80">{entry.description}</p>

      {isProfile && (
        <p className="text-xs text-muted-foreground">{t('ai.models.routingProfileNote')}</p>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-sm">
        {entry.contextTokens !== undefined && (
          <>
            <dt className="text-muted-foreground">{t('ai.models.columnContext')}</dt>
            <dd className="text-right text-foreground">
              {entry.contextTokens.toLocaleString()}
            </dd>
          </>
        )}
        {inputPrice && (
          <>
            <dt className="text-muted-foreground">{t('ai.models.columnInput')}</dt>
            <dd className="text-right text-foreground">
              ${displayPrice(inputPrice)}{' '}
              <span className="text-xs text-muted-foreground">
                {isPerMillionUnit(inputPrice.unit) ? t('ai.pricing.perMillion') : t('ai.pricing.perUnit')}
              </span>
            </dd>
          </>
        )}
        {outputPrice && (
          <>
            <dt className="text-muted-foreground">{t('ai.models.columnOutput')}</dt>
            <dd className="text-right text-foreground">
              ${displayPrice(outputPrice)}{' '}
              <span className="text-xs text-muted-foreground">
                {isPerMillionUnit(outputPrice.unit) ? t('ai.pricing.perMillion') : t('ai.pricing.perUnit')}
              </span>
            </dd>
          </>
        )}
        {regions.length > 0 && (
          <>
            <dt className="text-muted-foreground">{t('ai.model.regions')}</dt>
            <dd className="text-right text-foreground">{regions.join(', ')}</dd>
          </>
        )}
      </dl>
    </article>
  )
}
