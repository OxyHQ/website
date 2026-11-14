import type en from '../src/lib/i18n/locales/en';
import type { FaircoinParticipationPage } from '../src/lib/faircoin-participation-routes';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char,
  );

/** Public explanation only. Intake status and personal data never enter the build. */
export function renderFaircoinParticipation(
  page: FaircoinParticipationPage,
  copy: typeof en.faircoinParticipation,
  locale = 'en',
): string {
  const href = (target: string) => `${locale === 'en' ? '' : `/${locale}`}/faircoin/${target}/`;
  const paragraph = (text: string) =>
    `<p class="mt-6 text-lg leading-relaxed">${escapeHtml(text)}</p>`;
  const method =
    page === 'pilot'
      ? `<section><h2 class="mt-16 text-3xl">${escapeHtml(copy.methodTitle)}</h2><ol>${(['match', 'agree', 'review'] as const).map((step) => `<li><h3 class="mt-10 text-2xl">${escapeHtml(copy[`${step}Title`])}</h3>${paragraph(copy[`${step}Body`])}</li>`).join('')}</ol></section>`
      : `<section><h2 class="mt-16 text-3xl">${escapeHtml(copy.privacyTitle)}</h2>${paragraph(copy.privacyBody)}${paragraph(copy.noScript)}</section>`;
  return `<main data-faircoin-participation="${page}" data-pagefind-body class="faircoin-editorial min-h-screen bg-card px-4 py-24 text-foreground [font-family:'FairCoin_Editorial',sans-serif]"><article class="mx-auto max-w-5xl">${paragraph(copy.state)}<h1 class="mt-6 text-5xl font-normal">${escapeHtml(copy[`${page}Title`])}</h1>${paragraph(copy.body)}${paragraph(copy.noApproval)}<p class="mt-8"><a class="underline" href="${href(page === 'pilot' ? 'participate' : 'pilot')}">${escapeHtml(page === 'pilot' ? copy.propose : copy.how)}</a></p>${method}</article></main>`;
}

/** The landing keeps its initial canvas and exposes the new chapter below it. */
export function renderFaircoinPreparationChapter(
  copy: typeof en.faircoinParticipation,
  locale = 'en',
): string {
  const prefix = `${locale === 'en' ? '' : `/${locale}`}/faircoin`;
  return `<section id="participation" data-faircoin-participation="chapter" class="faircoin-editorial-dark bg-primary-foreground px-4 py-24 text-foreground [font-family:'FairCoin_Editorial',sans-serif]"><div class="mx-auto max-w-5xl"><p>${escapeHtml(copy.state)}</p><h2 class="mt-6 text-5xl font-normal">${escapeHtml(copy.title)}</h2><p class="mt-8 text-xl leading-relaxed">${escapeHtml(copy.body)}</p><p class="mt-8"><a class="underline" href="${prefix}/participate/">${escapeHtml(copy.propose)}</a></p><p class="mt-6"><a class="underline" href="${prefix}/pilot/">${escapeHtml(copy.how)}</a></p></div></section>`;
}
