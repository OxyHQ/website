import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { config } from '../config.js'
import crypto from 'node:crypto'
import path from 'node:path'

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: false,
})

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
}

function extFromMime(contentType: string): string {
  const base = contentType.split(';')[0].trim().toLowerCase()
  return MIME_EXT[base] || ''
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
  const urlExt = path.extname(originalName)
  const ext = urlExt || extFromMime(contentType) || '.bin'
  const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8)
  const baseName = urlExt ? path.basename(originalName, urlExt) : originalName
  const safeName = (baseName.replace(/[^a-z0-9_-]/gi, '-').slice(0, 60)) || 'image'
  const key = `${folder}/${safeName}-${hash}${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: `${config.s3.keyPrefix}${key}`,
    Body: buffer,
    ContentType: contentType,
  }))

  return `${config.s3.cdnBaseUrl}/${key}`
}

/**
 * Delete an object by its logical key (as returned in the stored CDN URL path).
 */
export async function deleteFromSpaces(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: config.s3.bucket,
    Key: `${config.s3.keyPrefix}${key}`,
  }))
}
