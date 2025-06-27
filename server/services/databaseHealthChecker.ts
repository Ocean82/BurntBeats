
import { Logger } from '../utils/logger';
import { env } from '../config/env';
import { db } from '../db';

const logger = new Logger({ name: 'DatabaseHealthChecker' });

export class DatabaseHealthChecker {
  static async checkConnection(): Promise<{ status: string; details?: string }> {
    try {
      // Check if database is enabled
      if (!env.DATABASE_URL) {
        return { 
          status: 'disabled',
          details: 'No DATABASE_URL configured'
        };
      }

      // Try to perform a simple query to test connection
      const startTime = Date.now();
      await db.execute('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return { 
        status: 'connected',
        details: `Connection successful (${responseTime}ms)`
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return { 
        status: 'disconnected',
        details: error.message 
      };
    }
  }
}
