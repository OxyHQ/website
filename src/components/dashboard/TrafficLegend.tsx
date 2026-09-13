import { useMapContrastRef } from './map-contrast'
import { ACTIVITY_CATEGORIES } from '../../data/dashboard/activity-categories'
import { useTranslation } from '../../lib/i18n'

export default function TrafficLegend() {
  const { t } = useTranslation()
  const contrastRef = useMapContrastRef()
  return (
    <div ref={contrastRef} style={{ color: "var(--map-internal)" }} className="pointer-events-none absolute left-8 right-8 top-20 z-10 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[10px]">
      {ACTIVITY_CATEGORIES.map(category => (
        <span key={category.id} className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: category.color }} />
          {t(`dashboard.traffic.${category.id}`)}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-primary" />{t('dashboard.traffic.external')}</span>
      <span className="inline-flex items-center gap-1.5"><span data-internal-legend="true" className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--map-internal)" }} />{t('dashboard.traffic.internal')}</span>
      <span>{t('dashboard.traffic.inbound')} → ◇ · ◇ → {t('dashboard.traffic.outbound')}</span>
    </div>
  )
}
