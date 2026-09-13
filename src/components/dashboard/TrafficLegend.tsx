import { ACTIVITY_CATEGORIES } from '../../data/dashboard/activity-categories'
import { useTranslation } from '../../lib/i18n'

export default function TrafficLegend() {
  const { t } = useTranslation()
  return (
    <div className="pointer-events-none absolute left-8 right-8 top-20 z-10 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
      {ACTIVITY_CATEGORIES.map(category => (
        <span key={category.id} className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: category.color }} />
          {t(`dashboard.traffic.${category.id}`)}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-primary" />{t('dashboard.traffic.external')}</span>
      <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-foreground" />{t('dashboard.traffic.internal')}</span>
      <span>{t('dashboard.traffic.inbound')} → ◇ · ◇ → {t('dashboard.traffic.outbound')}</span>
    </div>
  )
}
