import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/oxy-website',
  oxyApiBase: process.env.OXY_API_BASE || 'https://api.oxy.so',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminUsernames: ['oxy', 'nate'],
  githubToken: process.env.GITHUB_TOKEN || '',
}
