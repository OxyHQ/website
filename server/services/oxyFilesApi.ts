import type { ServerAssetsApi } from '@oxy.so/core/server';
import { oxyService } from './oxyService.js';

/**
 * The calls the site makes to Oxy Files, and nothing else. `services/oxyFiles.ts`
 * is the only caller; this seam is what the server test suite replaces with an
 * in-memory Oxy (`server/test/setup.ts`).
 */
export type OxyFilesApi = Pick<
  ServerAssetsApi,
  | 'uploadAppFile'
  | 'uploadAppFileLarge'
  | 'importAppFile'
  | 'deleteAppFile'
  | 'references'
  | 'publicUrl'
>;

export function oxyFilesApi(): OxyFilesApi {
  return oxyService.assets;
}
