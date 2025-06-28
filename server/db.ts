import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './db/schema';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set - database operations will fail');
  throw new Error('DATABASE_URL is not set');
}

try {
  const sql = neon(process.env.DATABASE_URL);
  export const db = drizzle(sql, { schema });
  console.log('✅ Database connection initialized successfully');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  throw error;
}