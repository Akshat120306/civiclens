import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'civiclens-sih-2026-super-secret-key-power-rangers',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  dbType: process.env.DB_TYPE || (process.env.DATABASE_URL ? 'postgres' : 'sqlite'),
  demoMode: process.env.DEMO_MODE !== 'false',
  uploadsDir: path.resolve(__dirname, '../../uploads'),
};
