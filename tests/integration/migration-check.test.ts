
import request from 'supertest';
import { app } from '../../server/index';
import { db } from '../../server/db';
import { users } from '../../shared/schema';

describe('Migration and API Integration', () => {
  test('should have applied migrations correctly', async () => {
    // Test if new columns exist by trying to insert data
    try {
      await db.insert(users).values({
        id: 'test-migration-user',
        username: 'migration-test',
        email: 'migration@test.com',
        songsThisMonth: 0,
        lastUsageReset: new Date(),
      });
      
      // Clean up
      await db.delete(users).where(users.id = 'test-migration-user');
      
      expect(true).toBe(true); // If we get here, migration worked
    } catch (error) {
      fail(`Migration failed: ${error.message}`);
    }
  });

  test('pricing API endpoints should be accessible', async () => {
    const plansResponse = await request(app)
      .get('/api/pricing/plans')
      .expect(200);
    
    expect(plansResponse.body).toHaveProperty('free');
    expect(plansResponse.body).toHaveProperty('basic');
    expect(plansResponse.body).toHaveProperty('pro');
    expect(plansResponse.body).toHaveProperty('enterprise');
  });

  test('health check should show migration status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.services).toHaveProperty('migrations');
    expect(response.body.services.migrations).toBe('applied');
  });
});
