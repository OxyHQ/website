import dotenv from 'dotenv'
dotenv.config()

function parseCsvEnv(value: string | undefined): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/oxy-website',
  oxyApiBase: process.env.OXY_API_BASE || 'https://api.oxy.so',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminUserIds: parseCsvEnv(process.env.OXY_ADMIN_USER_IDS),
  githubToken: process.env.GITHUB_TOKEN || '',
  doApiToken: process.env.DO_API_TOKEN || '',
  s3: {
    // Leave endpoint unset for native AWS S3; set AWS_ENDPOINT_URL for an S3-compatible
    // provider (e.g. DigitalOcean Spaces).
    endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    region: process.env.AWS_REGION || 'us-west-2',
    bucket: process.env.AWS_S3_BUCKET || 'oxy-oxy-api-media-usw2-237343248947',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    // Objects are written under this prefix; CloudFront origin path "/public" strips it back
    // off when serving. Empty for DO Spaces, where the CDN serves the bucket root.
    keyPrefix: process.env.AWS_S3_KEY_PREFIX || 'public/',
    // Public base URL fronting the bucket (AWS CloudFront: cloud.oxy.so).
    cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cloud.oxy.so',
  },
}
