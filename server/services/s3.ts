import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

/**
 * Upload a buffer to DigitalOcean Spaces.
 * Returns the public CDN URL.
 */
export async function uploadToSpaces(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = 'oxy-website/images',
): Promise<string> {
  const ext = path.extname(originalName) || '.bin'
  const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 8)
  const safeName = path.basename(originalName, ext).replace(/[^a-z0-9_-]/gi, '-').slice(0, 60)
  const key = `${folder}/${safeName}-${hash}${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }))

  return `https://${config.s3.bucket}.${config.s3.region}.cdn.digitaloceanspaces.com/${key}`
}
