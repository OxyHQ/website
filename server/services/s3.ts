import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config.js';
import crypto from 'node:crypto';
import path from 'node:path';

/* ──────────────────────────────────────────────
 * The LEGACY storage: objects under `oxy-website/` in Oxy's media bucket,
 * served from `config.s3.cdnBaseUrl`. Only `services/oxyFiles.ts` and the
 * migration write, read or delete through this module; new images and videos
 * go to Oxy Files. Retired with the bucket prefix (docs/OXY-FILES.md).
 * ──────────────────────────────────────────── */

/** Every object the site ever wrote is under this prefix of the logical key. */
export const LEGACY_KEY_PREFIX = 'oxy-website/';

/** Whether a logical key is one of the site's own legacy objects. */
export function isLegacyStorageKey(key: string): boolean {
  return key.startsWith(LEGACY_KEY_PREFIX) && !key.includes('..');
}

// No `credentials`: the SDK's default chain reads AWS_ACCESS_KEY_ID/
// AWS_SECRET_ACCESS_KEY locally and the ECS task role in production.
const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  forcePathStyle: false,
});

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/x-icon': '.ico',
};

function extFromMime(contentType: string): string {
  const base = contentType.split(';')[0].trim().toLowerCase();
  return MIME_EXT[base] || '';
}

/**
 * The logical key an upload of these bytes under this name would get.
 *
 * Content-addressed (an md5 prefix of the bytes), so the same file uploaded
 * twice to the same folder under the same name lands on the same key — which
 * is why a key can be shared by more than one media row, and why nothing may
 * delete an object without first checking that no other row still uses it.
 */
export function buildObjectKey(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = 'oxy-website/images',
): string {
  const urlExt = path.extname(originalName);
  const ext = urlExt || extFromMime(contentType) || '.bin';
  const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8);
  const baseName = urlExt ? path.basename(originalName, urlExt) : originalName;
  const safeName = baseName.replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) || 'image';
  return `${folder}/${safeName}-${hash}${ext}`;
}

/** The public CDN URL for a logical key. */
export function publicUrlForKey(key: string): string {
  return `${config.s3.cdnBaseUrl}/${key}`;
}

/** The logical key behind a stored CDN URL, or `null` when the URL is not parseable. */
export function keyFromPublicUrl(url: string): string | null {
  try {
    return new URL(url).pathname.slice(1) || null;
  } catch {
    return null;
  }
}

/**
 * Upload a buffer to object storage. Returns the public CDN URL.
 *
 * The logical key (`folder/file`) is what callers persist and pass back to
 * `deleteFromSpaces`; the physical object is stored under `config.s3.keyPrefix`
 * (e.g. `public/`), which CloudFront's origin path strips off when serving.
 */
export async function uploadToSpaces(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = 'oxy-website/images',
): Promise<string> {
  const key = buildObjectKey(buffer, originalName, contentType, folder);

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: `${config.s3.keyPrefix}${key}`,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return publicUrlForKey(key);
}

/**
 * Delete an object by its logical key (as returned in the stored CDN URL path).
 */
export async function deleteFromSpaces(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: `${config.s3.keyPrefix}${key}`,
    }),
  );
}

/** Read a legacy object's bytes by its logical key; `null` when there is no such object. */
export async function readFromSpaces(
  key: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const answer = await s3.send(
      new GetObjectCommand({ Bucket: config.s3.bucket, Key: `${config.s3.keyPrefix}${key}` }),
    );
    if (!answer.Body) return null;
    const bytes = await answer.Body.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      contentType: answer.ContentType ?? 'application/octet-stream',
    };
  } catch (error) {
    if ((error as { name?: unknown } | null)?.name === 'NoSuchKey') return null;
    throw error;
  }
}
