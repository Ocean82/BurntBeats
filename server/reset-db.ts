import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import { Logger } from './logger'; // Assuming you have a logging utility

neonConfig.webSocketConstructor = ws;

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Create a connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Reset Database Function
async function resetDatabase() {
  try {
    Logger.info('🔄 Resetting database...');

    // Ensure foreign key dependencies are dropped in correct order
    await db.execute(sql`DROP TABLE IF EXISTS song_versions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS voice_samples CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS songs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);    
    // Drop the migration tracking table
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`);

    Logger.success('✅ Database reset completed');
  } catch (error) {
    Logger.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    // Ensure the pool is closed
    await pool.end();
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase()
    .then(() => Logger.info('Database reset script executed successfully.'))
    .catch(err => Logger.error('Error executing reset script:', err));
}

export { resetDatabase };