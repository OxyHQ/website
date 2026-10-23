# The site's files in Oxy Files

Every file the site stores is a file **the Oxy Website application owns** in
Oxy Files (OxyHQ/oxy ADR 0043, stages 4, 4b and — for SVG — 4c). Content belongs to the site,
not to whichever editor uploaded it; the editor is kept on the media row as
`uploadedBy`, an audit field. Oxy stores the bytes once, serves them from
`cloud.oxy.so`, makes the webp renditions and deletes a file of the
application once nothing uses it.

Before this, the site wrote straight into Oxy's media bucket under
`public/oxy-website/…` (served as `https://cloud.oxy.so/oxy-website/…`) with
its own reference check (`isKeyInUse`) and deletion queue
(`storage_cleanups`). That is now the **legacy storage**; this document is
also its retirement runbook.

## What is where

| Content | Owner | How it gets there | Reference (`entityType`, `entityId`) |
|---|---|---|---|
| Media library image (newsroom covers, team avatars, product logos, course, help, resource and changelog art, hero poster, site settings) | Oxy Website application | admin upload (`POST /api/upload`) → `uploadAppFile` | `media`, the media row `_id` |
| Media library video (hero background WebM/MP4, changelog video) | Oxy Website application | admin upload → `uploadAppFile` | `media`, row `_id` |
| Image imported by URL (MCP `upload_image`, `upload_and_set_post_cover`, `upload_and_set_team_avatar`, `bulk_upload_post_covers`) | Oxy Website application | `importAppFile` — Oxy fetches the URL | `media`, row `_id` |
| Any other file an editor uploads (PDF, icon, archive, document) | Oxy Website application | admin upload → `uploadAppFileLarge` (resumable multipart, any type Oxy does not refuse; served as a download unless a browser renders it safely) | `media`, row `_id` |
| SVG (logos, icons) | Oxy Website application | admin upload → `uploadAppFile`; Oxy stores ONLY the sanitized document (stage 4c), serves it inline under `Content-Security-Policy: …; sandbox` and rasterizes the webp renditions from it. Against an Oxy API without stage 4c, which refuses SVG (415), the upload falls back to the legacy bucket and the migration carries it over later | `media`, row `_id` |
| Seeded app icons (`/images/apps/…`) and hotlinked seed covers | — (site's own static files / external) | `server/seed*.ts` | none |

The media row is the unit of use: posts, products, team members, the hero and
the rest point at media rows, and a media row holds exactly one reference to
its file. Two rows with the same bytes share one file (Oxy dedupes per owner),
each with its own reference. `server/services/oxyFiles.ts` is the only module
that talks to storage; `server/services/oxyFilesApi.ts` is the seam the test
suite replaces.

## The rules in code

- **The reference comes first.** A store registers the row's reference with
  the id the row is about to get, then writes the row (with whatever it is
  attached to) in one transaction. A failure before the reference leaves a
  file nothing uses — Oxy trashes it after 24 hours and purges it 30 days
  later — so an upload needs no compensation. A failure after it withdraws
  the reference.
- **A delete is durable.** Deleting a media row records its reference in
  `oxy_file_reference_removals` in the same transaction; the removal is tried
  at once and then by the sweep every 15 minutes, with backoff. When no other
  media row uses the file, the file is deleted too (`deleteAppFile`), so an
  editor's delete takes the image off the CDN now rather than after Oxy's
  grace period; Oxy refuses (`FILE_IN_USE`) while anything else references it.
- **Bytes are checked, never declared types.** The admin upload route does
  not pass the browser's type on at all. Uploads are sniffed and decoded as
  before (JPEG, PNG, GIF, WebP, AVIF; MP4/WebM for editor uploads); an SVG is
  recognised by its document root; any other file is typed by its bytes (PDF,
  Windows icon) or recorded `application/octet-stream`, keeping its own
  extension, which Oxy uses to refuse programs and active documents (415). The
  SHA-256 Oxy reports must equal the one the site computed — except for an
  SVG, which Oxy stores as its sanitized document: that is read back from Oxy
  and must hash to the SHA-256 Oxy reported and be an SVG document, and the
  row records the stored document's hash and size. An SVG Oxy cannot sanitize
  (415 `INVALID_SVG`: malformed, not UTF-8, compressed) is refused to the
  editor.
  An import by URL is read back from Oxy and held to the same rules, because
  Oxy's importer accepts whatever image type the source declares.
- **Reconciliation is the net** (ADR 0043 D6). Once a day one task sends the
  full inventory of `media` rows holding an Oxy file; Oxy adds what it is
  missing and removes what no row holds. Runs are recorded in
  `oxy_file_reconciliations`; `bun run oxy-files reconcile [--dry-run]` runs
  one now.
- **Takedowns and deletions hide the item.** Oxy's file events
  (`POST /api/oxy/file-events`, mounted before `express.json()` because the
  signature covers the raw body) mark every row holding a blocked, trashed or
  deleted file `unavailableAt`; `db/refs.ts`, the newsroom populate and
  `GET /api/media/:id` then treat the row as missing, so pages render no image
  rather than a broken one. `file.unblocked` / `file.restored` clear it; a
  deleted file never comes back. Each event is applied once (dedupe on its id)
  and recorded with what was done in `oxy_file_events`. Columns that hold a
  copied URL instead of a media id (testimonial avatars, SEO images, markdown)
  cannot be hidden this way; Oxy stops serving the file and the browser shows
  nothing.

## Configuration

| Setting | Where | Notes |
|---|---|---|
| Registered website workload | Oxy workload registry + ECS task role | Temporary role credentials; local IAM SSO requires its own registered binding |
| `OXY_FILES_WEBHOOK_SECRET` | SSM `/oxy/website-api/OXY_FILES_WEBHOOK_SECRET` (SecureString) + the `secrets` list of `module "website_api"` in oxy-infra `terraform-uswest2/app-services.tf` | shown once when the endpoint is set; without it events get 503 and Oxy retries. The task definition ignores Terraform changes, so the revision carrying it is rolled out by hand (oxy-infra runbook 46) |
| `OXY_CLOUD_URL` | optional | default `https://cloud.oxy.so` |
| `OXY_FILES_RECONCILE_HOURS` | optional | default 24 |
| `AWS_S3_BUCKET`, `AWS_S3_KEY_PREFIX`, `CDN_BASE_URL` | existing | legacy storage only, until retirement |

The legacy objects share a bucket and a host with Oxy's own files, so the
code refuses a legacy delete outside `oxy-website/` (`deleteLegacyObject`):
a URL like `https://cloud.oxy.so/<fileId>` parses to a key that is not the
site's.

The Oxy Website application uses its verified workload identity without app
scopes or consent. Its file-events endpoint must be set to `https://website-api.oxy.so/api/oxy/file-events`
(console → Webhooks → File events, or `oxy.apps.setFilesWebhook`). Oxy's own
applications are not metered (ADR 0043 D2).

## Moving the legacy storage over

`bun run oxy-files` talks to the database in `DATABASE_URL`, the bucket
through the AWS default credential chain (it needs `s3:GetObject` on
`public/oxy-website/*`) and Oxy with the registered workload identity. Its output
carries ids, SHA-256s and counts, never a URL.

Run it once the Oxy API with ADR 0043 stage 4c (OxyHQ/oxy#1774) is deployed,
so the SVGs carry over in the same run; run earlier, they are `deferred` and a
later run takes them.

1. `bun run oxy-files census` — where the media stands: rows in Oxy, on the
   legacy storage, legacy URLs
   per `table.column` and per host, pending removals and cleanups.
2. `bun run oxy-files migrate` — a preview: nothing is written anywhere.
3. `bun run oxy-files migrate --apply [--limit N] [--report <file>]`:
   - legacy URLs that content holds but no media row owns get a row of their
     own (folder `migrated`);
   - each legacy row is read from the bucket, hashed, typed from its bytes
     (the row's recorded type, and a name extension that disagrees, are
     corrected — the legacy upload trusted the browser, so raster images were
     recorded as `application/octet-stream` named `.bin`), stored as an
     application file (the large upload for anything not an image, video or
     SVG) and switched only when Oxy's SHA-256 equals the bucket's — an SVG,
     stored sanitized, only when the document read back from Oxy hashes to
     the SHA-256 Oxy reported; its
     reference is registered; its legacy key and thumbnails are kept
     (`media_storage_migrations`) so a delete during the soak still removes
     the old copies;
   - every column holding a migrated legacy URL is rewritten to the Oxy URL
     (a legacy thumbnail to the matching rendition), only where the value is
     still the one read.
   It exits non-zero while any row failed. Re-running is safe and resumes: a
   migrated row is never read again, a failed one is retried, and an SVG the
   Oxy API refuses because it predates stage 4c is recorded as `deferred`
   (`svg_not_accepted`), its type corrected to `image/svg+xml`, and carried
   over by the next run once the API takes SVG. A file Oxy refuses outright
   (an HTML page, a program — 415)
   is reported `failed` and stays until an editor deletes it.
4. Run `reconcile` once before Oxy's lifecycle sweep is switched to
   `enforce`: an application file the site uses but never referenced would
   otherwise be trashed 24 hours later.

## Soak and retirement of the legacy storage

During the soak both kinds of URL are served: rows and copies the migration
switched point at Oxy, anything it has not reached still points at the
bucket. Every daily reconciliation logs one `[oxy-files:census]` line with the
counts above.

The legacy storage is retired only when **all** of these hold:

1. **No legacy rows or copies.** The census shows `media.legacy = 0`,
   `migrations.deferred` absent, `legacyUrlRows = {}`,
   `legacyUrlHosts = {}` and `pending.legacyCleanups = 0`, on production, for
   14 consecutive daily census lines.
2. **No legacy reads.** The `cloud.oxy.so` distribution (its cache behavior
   `/oxy-website/*`) has served no request under
   `/oxy-website/` for 14 consecutive days. Neither CloudFront standard logs
   nor S3 server access logs are enabled today (oxy-infra `cdn.tf`,
   `s3-apps.tf`), so enabling one of them is the first step of the soak, and
   the 14 days start then. A remaining hit is traced to the URL still holding
   it and fixed first; a crawler's request with no referrer is not a reader.
3. **The migration's record is complete.** `media_storage_migrations` has no
   `failed` row; every `migrated` row has `legacy_sha256 = oxy_sha256`.

Then, in one website PR and one oxy-infra change:

- website: drop `server/services/s3.ts`, `server/services/thumbnails.ts`, the
  legacy half of `server/services/oxyFiles.ts` and of `server/services/media.ts`
  (`isKeyInUse`, `storage_cleanups` and its sweep), the `key` column's legacy
  meaning, and the `AWS_S3_*`/`CDN_BASE_URL` configuration; a `post` migration
  drops `storage_cleanups`. `media_storage_migrations` stays as the record.
- oxy-infra: remove the website task role's media-bucket policy, the
  `AWS_S3_*`/`CDN_BASE_URL` task environment, and the `/oxy-website/*` cache
  behavior of the `cloud.oxy.so` distribution.
- Delete the objects under `public/oxy-website/` in the media bucket, after a
  final listing of their keys and sizes is archived.
