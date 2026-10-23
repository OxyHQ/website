/* ──────────────────────────────────────────────
 * OxyOS releases.
 *
 * The one source for the release list: `/os/downloads` renders it, and the
 * build publishes it as `/os/releases.json` (`scripts/vite-oxyos-releases-feed.ts`)
 * in the shape `oxyos-upgrade` reads (`.latest.version`, `.latest.codename`,
 * `.latest.debian_base`). Add a release at the TOP: the first entry is the
 * current one.
 *
 * Keep this file dependency-free — the Vite config imports it.
 * ──────────────────────────────────────────── */

export type OxyOSArchitecture = 'amd64';

export interface OxyOSRelease {
  /** `1.0`, without the `v`. The git tag is `v<version>`. */
  readonly version: string;
  /** Machine codename, as written to `OS_VERSION_CODENAME`. */
  readonly codename: string;
  /** Codename for display. */
  readonly name: string;
  /** The Debian suite the release is built on. */
  readonly debianBase: string;
  readonly architectures: readonly OxyOSArchitecture[];
}

export const OXYOS_RELEASES: readonly OxyOSRelease[] = [
  {
    version: '1.0',
    codename: 'ozone',
    name: 'Ozone',
    debianBase: 'trixie',
    architectures: ['amd64'],
  },
];

export const OXYOS_ARCHITECTURE_LABELS: Record<OxyOSArchitecture, string> = {
  amd64: 'amd64 (x86_64)',
};

export function oxyosReleaseTag(release: OxyOSRelease): string {
  return `v${release.version}`;
}

/**
 * Where a release's image is downloaded from — the one place that decides it.
 * `{tag}`, `{version}` and `{architecture}` are filled in per row.
 *
 * The images live in the public R2 bucket `oxy-downloads`, served at
 * downloads.oxy.so (oxy-infra runbook 61). Each ISO has its checksum beside it,
 * at the same URL plus `.md5`. The GitHub releases carry no image.
 */
export const OXYOS_DOWNLOAD_URL_TEMPLATE =
  'https://downloads.oxy.so/oxyos/oxyos-{version}-{architecture}.iso';

export function oxyosDownloadUrl(release: OxyOSRelease, architecture: OxyOSArchitecture): string {
  return OXYOS_DOWNLOAD_URL_TEMPLATE.replaceAll('{tag}', oxyosReleaseTag(release))
    .replaceAll('{version}', release.version)
    .replaceAll('{architecture}', architecture);
}

/** The `/os/releases.json` document. */
export function oxyosReleasesFeed() {
  const toEntry = (release: OxyOSRelease) => ({
    version: release.version,
    codename: release.codename,
    debian_base: release.debianBase,
    tag: oxyosReleaseTag(release),
    architectures: release.architectures,
  });
  const [latest] = OXYOS_RELEASES;
  return {
    latest: latest
      ? { version: latest.version, codename: latest.codename, debian_base: latest.debianBase }
      : null,
    releases: OXYOS_RELEASES.map(toEntry),
  };
}
