
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Database migrations completed');
  } catch (error) {
    // Handle case where tables already exist
    if (error.code === '42P07' && error.message.includes('already exists')) {
      console.log('⚠️  Tables already exist, skipping migration');
      console.log('✅ Database schema is up to date');
    } else {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

// Check if this file is being run directly (ES module equivalent of require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(console.error);
}

export { runMigrations };
