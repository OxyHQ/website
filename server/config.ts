import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/oxy-website',
  oxyApiBase: process.env.OXY_API_BASE || 'https://api.oxy.so',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminUsernames: ['oxy', 'nate'],
  githubToken: process.env.GITHUB_TOKEN || '',
  doApiToken: process.env.DO_API_TOKEN || '',
  s3: {
    endpoint: process.env.AWS_ENDPOINT_URL || 'https://ams3.digitaloceanspaces.com',
    region: process.env.AWS_REGION || 'ams3',
    bucket: process.env.AWS_S3_BUCKET || 'oxy-bucket',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}
