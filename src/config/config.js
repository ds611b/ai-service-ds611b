import dotenv from 'dotenv';

dotenv.config();

export default {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  docsPath: process.env.DOCS_PATH,
  google: {
    ai: {
      apiKey: process.env.GOOGLE_AI_API_KEY || ''
    }
  }
};