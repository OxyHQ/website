import { describe, expect, test } from 'bun:test';
import { renderSEO } from '../src/entry-server';
import { buildSiteIdentity, type SeoData } from '../src/lib/seo';
import { localizedSeoCopy } from './localized-seo';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/types';
import es from '../src/lib/i18n/locales/es';

const cms: SeoData = {
  oxy: {
    default: null,
    routes: {
      '/pricing': {
        title: 'Plans | Oxy',
        description: 'Choose your Oxy plan.',
        ogImage: '/og-default.png',
      },
    },
  },
  faircoin: { default: null, routes: {} },
};
const input = { title: 'Precios', description: 'Elige tu plan de Oxy.', canonicalPath: '/pricing' };

describe('shared SEO output', () => {
  test('prerender translates marketing copy using the mounted page dictionaries', async () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { default: dictionary } = await import(`../src/lib/i18n/locales/${locale}.ts`);
      for (const path of ['/', '/pricing', '/one', '/store', '/company', '/enterprise', '/help']) {
        const copy = localizedSeoCopy(path, dictionary);
        expect(copy?.title).toBeTruthy();
        expect(copy?.description).toBeTruthy();
      }
    }
    expect(localizedSeoCopy('/pricing/', es)).toEqual({
      title: es.pricingHub.seoTitle,
      description: es.pricingHub.description,
    });
    expect(localizedSeoCopy('/apps/mention', es)).toBeNull();
    expect(localizedSeoCopy('/developers/docs', es)).toBeNull();
  });
  test('keeps translated metadata when the CMS contains default-language copy', () => {
    const { head } = renderSEO(input, cms, {
      locale: 'es',
      locales: [{ code: 'es', translationReady: true }],
    });
    expect(head).toContain('<title>Precios | Oxy</title>');
    expect(head).toContain('content="Elige tu plan de Oxy."');
    expect(head).toContain('href="https://oxy.so/es/pricing/"');
    expect(head).toContain('property="og:locale:alternate" content="en_US"');
    expect(head).not.toContain('Choose your Oxy plan.');
  });

  test('retains editorial overrides in the default locale', () => {
    const { head } = renderSEO(input, cms);
    expect(head).toContain('<title>Plans | Oxy</title>');
    expect(head).toContain('content="Choose your Oxy plan."');
  });

  test('empty editorial fields cannot erase a page title or description', () => {
    const empty: SeoData = {
      ...cms,
      oxy: {
        default: null,
        routes: {
          '/pricing': {
            title: ' ',
            description: '',
            ogImage: '',
          },
        },
      },
    };
    const { head } = renderSEO(input, empty);
    expect(head).toContain('<title>Precios | Oxy</title>');
    expect(head).toContain('content="Elige tu plan de Oxy."');
  });

  test('site identity is valid JSON in the initial HTML with stable entity IDs', () => {
    const { head } = renderSEO(input);
    const scripts = [
      ...head.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    ];
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0][1])).toEqual(buildSiteIdentity());
    expect(head).toContain('content="max-image-preview:large"');
  });

  test('non-indexable pages do not advertise translated alternates', () => {
    const { head } = renderSEO({ ...input, noIndex: true }, null, {
      locales: [{ code: 'es', translationReady: true }],
    });
    expect(head).toContain('content="noindex, nofollow"');
    expect(head).not.toContain('hreflang');
    expect(head).not.toContain('application/ld+json');
  });

  test('external canonicals never advertise a competing locale set', () => {
    const { head } = renderSEO(
      { ...input, canonicalUrl: 'https://mention.earth/jobs/example/' },
      null,
      {
        locales: [{ code: 'es', translationReady: true }],
      },
    );
    expect(head).toContain('href="https://mention.earth/jobs/example/"');
    expect(head).not.toContain('hreflang');
  });

  test('FairCoin never inherits the Oxy organization or its social identities', () => {
    const data = buildSiteIdentity('fairco.in');
    expect(data['@graph']).toEqual([
      {
        '@type': 'WebSite',
        '@id': 'https://fairco.in/#website',
        name: 'FairCoin',
        url: 'https://fairco.in/',
      },
    ]);
    expect(JSON.stringify(data)).not.toContain('oxy');
  });
});
