import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { Logger } from './logger'; // Assuming you have a logger utility

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Validate environment variables
function validateEnvironment() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }

  if (!process.env.DATABASE_CONNECTION_LIMIT) {
    Logger.warn('DATABASE_CONNECTION_LIMIT not set, using default value');
  }
}

// Database connection configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  allowExitOnIdle: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
};

// Connection pool with enhanced error handling
export const pool = new Pool(connectionConfig);

// Event listeners for connection pool
pool.on('connect', (client) => {
  Logger.debug('New database connection established');
});

pool.on('error', (err) => {
  Logger.error('Database connection error', err);
});

pool.on('remove', (client) => {
  Logger.debug('Database connection removed');
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  Logger.info('Closing database connections...');
  await pool.end();
  Logger.info('Database connections closed');
  process.exit(0);
});

// Drizzle ORM instance with schema validation
export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query, params) => {
      Logger.debug('Executing query:', { query, params });
    }
  } : false
});

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    Logger.error('Database connection check failed', error);
    return false;
  }
}

// Connection manager with retry logic
export class DatabaseConnection {
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000;

  static async withConnection<T>(fn: (client: any) => Promise<T>): Promise<T> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.MAX_RETRIES) {
      try {
        const client = await pool.connect();
        try {
          return await fn(client);
        } finally {
          client.release();
        }
      } catch (error) {
        lastError = error as Error;
        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    throw lastError || new Error('Failed to establish database connection');
  }
}

// Initialize and validate
try {
  validateEnvironment();
  Logger.info('Database connection configured successfully');
} catch (error) {
  Logger.error('Database configuration failed', error);
  process.exit(1);
}
