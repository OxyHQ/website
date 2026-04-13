import sharp from 'sharp'
import { uploadToSpaces } from './s3.js'

interface ThumbnailResult {
  width?: number
  height?: number
  thumbnails: { sm: string; md: string; lg: string }
}

const SIZES = [
  { name: 'sm' as const, width: 200 },
  { name: 'md' as const, width: 400 },
  { name: 'lg' as const, width: 800 },
]

/**
 * Detect image dimensions and generate thumbnail variants.
 * Returns the original dimensions + CDN URLs for each thumbnail size.
 * For non-image files, returns empty thumbnails.
 */
export async function processImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string,
): Promise<ThumbnailResult> {
  const isImage = mimeType.startsWith('image/')
  if (!isImage) return { thumbnails: { sm: '', md: '', lg: '' } }

  // Detect dimensions
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width
  const height = metadata.height

  // Generate thumbnails
  const thumbs: Record<string, string> = {}
  for (const size of SIZES) {
    // Skip if original is smaller than target
    if (width && width <= size.width) {
      thumbs[size.name] = '' // will fall back to original
      continue
    }

    const resized = await sharp(buffer)
      .resize(size.width, undefined, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer()

    const thumbName = originalName.replace(/\.[^.]+$/, `-${size.name}.jpg`)
    thumbs[size.name] = await uploadToSpaces(resized, thumbName, 'image/jpeg', `${folder}/thumbs`)
  }

  return {
    width,
    height,
    thumbnails: {
      sm: thumbs.sm || '',
      md: thumbs.md || '',
      lg: thumbs.lg || '',
    },
  }
}
