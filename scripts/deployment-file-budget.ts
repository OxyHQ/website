import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const CF_PAGES_FILE_LIMIT = 20_000;
export const FILE_BUDGET = 18_000;

export async function countDeploymentFiles(
  directory: string,
  options: { excludeRouteDocuments?: boolean; excludeIndexStubs?: boolean } = {},
): Promise<number> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => {
    if (!entry.isFile()) return false;
    if (options.excludeRouteDocuments && entry.name === 'index.html') return false;
    const relative = path.relative(directory, path.join(entry.parentPath, entry.name));
    const segments = relative.split(path.sep);
    if (options.excludeIndexStubs && segments.length > 1 && segments[0].endsWith('-content')) {
      return false;
    }
    return true;
  }).length;
}

export function assertDeploymentFileBudget(count: number): void {
  if (count > FILE_BUDGET) {
    throw new Error(
      `Deployment has ${count} files, above the ${FILE_BUDGET} budget ` +
        `(Cloudflare Pages limit ${CF_PAGES_FILE_LIMIT}). Reduce emitted files before deploying.`,
    );
  }
}
