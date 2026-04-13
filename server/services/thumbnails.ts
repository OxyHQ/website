import { uploadToSpaces } from './s3.js'

interface ThumbnailResult {
  width?: number
  height?: number
  thumbnails: { sm: string; md: string; lg: string }
}

const EMPTY_THUMBS: ThumbnailResult = { thumbnails: { sm: '', md: '', lg: '' } }

const SIZES = [
  { name: 'sm' as const, width: 200 },
  { name: 'md' as const, width: 400 },
  { name: 'lg' as const, width: 800 },
]

/**
 * Detect image dimensions and generate thumbnail variants.
 * Falls back gracefully if sharp is unavailable (e.g. missing native bindings).
 */
export async function processImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string,
): Promise<ThumbnailResult> {
  if (!mimeType.startsWith('image/')) return EMPTY_THUMBS

  let sharp: typeof import('sharp') | null = null
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('sharp not available, skipping thumbnail generation')
    return EMPTY_THUMBS
  }

  try {
    const metadata = await sharp(buffer).metadata()
    const width = metadata.width
    const height = metadata.height

    const thumbs: Record<string, string> = {}
    for (const size of SIZES) {
      if (width && width <= size.width) {
        thumbs[size.name] = ''
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
  } catch (err) {
    console.warn('Thumbnail generation failed:', err)
    return EMPTY_THUMBS
  }
}
