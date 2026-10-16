/**
 * Operator commands for the site's files in Oxy Files (docs/OXY-FILES.md).
 *
 *   bun run oxy-files census                  where the media stands (read only)
 *   bun run oxy-files migrate [--limit N]     preview the legacy migration (read only)
 *   bun run oxy-files migrate --apply [--limit N] [--report <file>]
 *   bun run oxy-files reconcile [--dry-run]   reconcile references with Oxy now
 *
 * Talks to the database in `DATABASE_URL`, the legacy bucket through the AWS
 * default credential chain, and Oxy with `OXY_SERVICE_API_KEY`/`_SECRET`.
 * Output is JSON with ids, hashes and counts — never a URL.
 */
import { writeFile } from 'node:fs/promises';
import { closeDatabase } from '../db/postgres.js';
import {
  legacyCdnHost,
  legacyStorageCensus,
  migrateLegacyStorage,
} from '../services/oxyFilesMigration.js';
import { reconcileMediaFiles } from '../services/oxyFilesReconcile.js';

const USAGE =
  'usage: oxy-files census | migrate [--apply] [--limit N] [--report <file>] | reconcile [--dry-run]';

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  if (command === 'census') {
    process.stdout.write(`${JSON.stringify(await legacyStorageCensus(), null, 2)}\n`);
    return 0;
  }
  if (command === 'migrate') {
    const limitText = option(rest, '--limit');
    const limit = limitText === undefined ? undefined : Number.parseInt(limitText, 10);
    if (limit !== undefined && !(Number.isInteger(limit) && limit > 0)) {
      process.stderr.write(`--limit must be a positive integer\n${USAGE}\n`);
      return 2;
    }
    const apply = rest.includes('--apply');
    process.stderr.write(
      `[oxy-files] ${apply ? 'APPLYING' : 'previewing'} the migration from ${legacyCdnHost()}\n`,
    );
    const report = await migrateLegacyStorage({ apply, limit });
    const reportPath = option(rest, '--report');
    if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    const { items, ...summary } = report;
    process.stdout.write(
      `${JSON.stringify({ ...summary, failed: items.filter((item) => item.status === 'failed') }, null, 2)}\n`,
    );
    return report.media.failed > 0 ? 1 : 0;
  }
  if (command === 'reconcile') {
    const outcome = await reconcileMediaFiles({ dryRun: rest.includes('--dry-run'), force: true });
    process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`);
    return outcome.status === 'done' ? 0 : 1;
  }
  process.stderr.write(`${USAGE}\n`);
  return 2;
}

const code = await main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(
    `[oxy-files] failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  return 1;
});
await closeDatabase();
process.exit(code);
