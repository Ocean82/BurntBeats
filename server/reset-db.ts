
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Drop tables in correct order (respect foreign keys)
    await db.execute(sql`DROP TABLE IF EXISTS song_versions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS songs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS voice_samples CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    
    // Drop the migration tracking table
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`);
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };
