import { Badge } from '@oxy.so/bloom/badge';
import { RiDownloadLine } from '@oxy.so/bloom/icons/RiDownloadLine';
import {
  OXYOS_ARCHITECTURE_LABELS,
  OXYOS_RELEASES,
  oxyosDownloadUrl,
  oxyosReleaseTag,
} from '../../data/oxyosReleases';
import { useTranslation } from '../../lib/i18n/use-translation';

/** One row per release and architecture; the first release is the current one. */
const downloads = OXYOS_RELEASES.flatMap((release, index) =>
  release.architectures.map((architecture) => ({
    key: `${release.version}-${architecture}`,
    label: `${oxyosReleaseTag(release)} (${release.name})`,
    architecture: OXYOS_ARCHITECTURE_LABELS[architecture],
    href: oxyosDownloadUrl(release, architecture),
    current: index === 0,
  })),
);

export default function OxyOSDownloadsContent() {
  const { t } = useTranslation();

  return (
    <div className="cursor-theme oxyos-theme">
      <section className="section section--headline bg-background text-foreground">
        <div className="container">
          <div className="max-w-prose-medium-wide">
            <h1 className="type-xl sm:type-2xl text-balance mb-v1">{t('oxyosDownloads.title')}</h1>
            <p className="type-base text-muted-foreground text-pretty">
              {t('oxyosDownloads.description')}
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-background text-foreground pt-0">
        <div className="container">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table
              className="w-full min-w-[36rem] border-collapse text-left text-sm"
              aria-label={t('oxyosDownloads.tableLabel')}
            >
              <thead>
                <tr className="border-b border-border bg-surface text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium sm:pl-6">
                    {t('oxyosDownloads.version')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('oxyosDownloads.architecture')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('oxyosDownloads.download')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('oxyosDownloads.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {downloads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      {t('oxyosDownloads.empty')}
                    </td>
                  </tr>
                ) : (
                  downloads.map((download) => (
                    <tr key={download.key} className="border-b border-border/60 last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground sm:pl-6">
                        {download.label}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                        {download.architecture}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <a
                          href={download.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-medium text-primary-text underline-offset-4 transition-colors hover:text-primary hover:underline"
                        >
                          <RiDownloadLine width={18} height={18} fill="currentColor" aria-hidden />
                          {t('oxyosDownloads.iso')}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="inline-flex">
                          <Badge
                            content={
                              download.current
                                ? t('oxyosDownloads.current')
                                : t('oxyosDownloads.older')
                            }
                            appearance="subtle"
                            tone={download.current ? 'success' : 'neutral'}
                            size="label-small"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
