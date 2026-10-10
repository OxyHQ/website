import type { Plugin } from 'vite';
import { oxyosReleasesFeed } from '../src/data/oxyosReleases';

const FEED_PATH = '/os/releases.json';

/**
 * Publish the OxyOS release list at `/os/releases.json`, the URL `oxyos-upgrade`
 * reads. It is generated from `src/data/oxyosReleases.ts`, so the downloads page
 * and the feed can never disagree.
 */
export default function oxyosReleasesFeedPlugin(): Plugin {
  const body = () => `${JSON.stringify(oxyosReleasesFeed(), null, 2)}\n`;
  let ssr = false;
  return {
    name: 'oxyos-releases-feed',
    configResolved(config) {
      ssr = !!config.build.ssr;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (new URL(req.url ?? '/', 'http://localhost').pathname !== FEED_PATH) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(req.method === 'HEAD' ? undefined : body());
      });
    },
    generateBundle() {
      if (ssr) return;
      this.emitFile({ type: 'asset', fileName: FEED_PATH.slice(1), source: body() });
    },
  };
}
