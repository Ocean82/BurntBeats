
import { Logger } from '../utils/logger';
import { env } from '../config/env';
import { BeatAnalytics } from './beat-analytics';

// Optional Replit DB for high-performance caching
let replitDB: any = null;
try {
  const Database = require('@replit/database');
  replitDB = new Database();
  console.log('🔥 Replit DB cache enabled for analytics');
} catch (error) {
  console.log('📊 Using file-based analytics only');
}

const logger = new Logger({ name: 'BeatAnalyticsService' });

interface BeatStats {
  beatId: string;
  plays: number;
  downloads: number;
  licenses: number;
  revenue: number;
  popularityScore: number;
  uniquePlays?: number;
  lastPlayed?: string;
  dailyPlays?: Record<string, number>;
}

export class BeatAnalyticsService {
  /**
   * Get comprehensive beat statistics
   */
  static async getBeatStats(beatId: string): Promise<BeatStats | null> {
    try {
      const cacheKey = `beat_stats_${beatId}`;
      
      // Try Replit DB cache first for super fast response
      if (replitDB) {
        try {
          const cached = await replitDB.get(cacheKey);
          if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
            logger.debug(`Cache hit for beat ${beatId}`);
            return cached.data;
          }
        } catch (cacheError) {
          logger.debug('Cache miss, fallback to persistent storage');
        }
      }

      // Get analytics from the existing BeatAnalytics service
      const analytics = await BeatAnalytics.getBeatStats(beatId);
      
      if (!analytics) {
        logger.warn(`No analytics found for beat ${beatId}`);
        return null;
      }

      // Transform to BeatStats format
      const stats: BeatStats = {
        beatId: analytics.beatId,
        plays: analytics.totalPlays,
        downloads: 0, // This would need to be tracked separately
        licenses: 0,  // This would need to be tracked separately  
        revenue: 0,   // This would need to be tracked separately
        popularityScore: analytics.popularityScore,
        uniquePlays: analytics.uniquePlays,
        lastPlayed: analytics.lastPlayed,
        dailyPlays: analytics.dailyPlays
      };

      // Cache in Replit DB for fast future access
      if (replitDB) {
        try {
          await replitDB.set(cacheKey, {
            data: stats,
            timestamp: Date.now()
          });
        } catch (cacheError) {
          logger.debug('Failed to cache stats, continuing without cache');
        }
      }

      logger.info(`Retrieved stats for beat ${beatId}`, { 
        plays: stats.plays, 
        popularityScore: stats.popularityScore 
      });

      return stats;
    } catch (error) {
      logger.error(`Failed to get beat stats for ${beatId}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get top performing beats based on popularity score
   */
  static async getTopBeats(limit: number = 10): Promise<BeatStats[]> {
    try {
      const topBeats = await BeatAnalytics.getTopBeats(limit);
      
      const stats: BeatStats[] = topBeats.map(beat => ({
        beatId: beat.beatId,
        plays: beat.totalPlays,
        downloads: 0, // Would need separate tracking
        licenses: 0,  // Would need separate tracking
        revenue: 0,   // Would need separate tracking
        popularityScore: beat.popularityScore,
        uniquePlays: beat.uniquePlays,
        lastPlayed: beat.lastPlayed,
        dailyPlays: beat.dailyPlays
      }));

      logger.info(`Retrieved top ${stats.length} beats`);
      return stats;
    } catch (error) {
      logger.error('Failed to get top beats', { error: error.message });
      return [];
    }
  }

  /**
   * Get trending beats for a specific time period
   */
  static async getTrendingBeats(days: number = 7, limit: number = 10): Promise<BeatStats[]> {
    try {
      const trendingBeats = await BeatAnalytics.getTrendingBeats(days, limit);
      
      const stats: BeatStats[] = trendingBeats.map(beat => ({
        beatId: beat.beatId,
        plays: beat.totalPlays,
        downloads: 0,
        licenses: 0,
        revenue: 0,
        popularityScore: beat.popularityScore,
        uniquePlays: beat.uniquePlays,
        lastPlayed: beat.lastPlayed,
        dailyPlays: beat.dailyPlays
      }));

      logger.info(`Retrieved ${stats.length} trending beats for last ${days} days`);
      return stats;
    } catch (error) {
      logger.error('Failed to get trending beats', { error: error.message });
      return [];
    }
  }

  /**
   * Record a beat play event
   */
  static async recordPlay(beatId: string, userId?: string, sessionId?: string): Promise<void> {
    try {
      // Record in persistent storage first
      await BeatAnalytics.recordPlay(beatId, userId, sessionId);
      
      // Update Replit DB cache immediately for real-time analytics
      if (replitDB) {
        try {
          const cacheKey = `beat_stats_${beatId}`;
          const realtimeKey = `realtime_${beatId}`;
          
          // Increment real-time counter
          const currentCount = (await replitDB.get(realtimeKey)) || 0;
          await replitDB.set(realtimeKey, currentCount + 1);
          
          // Invalidate stats cache to force fresh data on next request
          await replitDB.delete(cacheKey);
          
          logger.debug(`Real-time analytics updated for beat ${beatId}`);
        } catch (cacheError) {
          logger.debug('Cache update failed, continuing with persistent storage only');
        }
      }
      
      logger.info(`Recorded play for beat ${beatId}`, { userId, sessionId });
    } catch (error) {
      logger.error(`Failed to record play for beat ${beatId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get overall analytics summary
   */
  static async getAnalyticsSummary(): Promise<{
    totalBeats: number;
    totalPlays: number;
    totalUniqueListeners: number;
    averagePopularityScore: number;
  }> {
    try {
      const summary = await BeatAnalytics.getAnalyticsSummary();
      logger.info('Retrieved analytics summary', summary);
      return summary;
    } catch (error) {
      logger.error('Failed to get analytics summary', { error: error.message });
      return {
        totalBeats: 0,
        totalPlays: 0,
        totalUniqueListeners: 0,
        averagePopularityScore: 0
      };
    }
  }

  /**
   * Get real-time play count (Replit DB only for instant updates)
   */
  static async getRealTimePlays(beatId: string): Promise<number> {
    if (!replitDB) return 0;
    
    try {
      const realtimeKey = `realtime_${beatId}`;
      const count = await replitDB.get(realtimeKey);
      return count || 0;
    } catch (error) {
      logger.debug(`Failed to get real-time plays for ${beatId}`);
      return 0;
    }
  }

  /**
   * Get trending beats from Replit DB cache (faster than file system)
   */
  static async getTrendingFromCache(limit: number = 5): Promise<string[]> {
    if (!replitDB) return [];
    
    try {
      const keys = await replitDB.list();
      const realtimeKeys = keys.filter(key => key.startsWith('realtime_'));
      
      const beatCounts = await Promise.all(
        realtimeKeys.map(async (key) => {
          const beatId = key.replace('realtime_', '');
          const count = await replitDB.get(key);
          return { beatId, count: count || 0 };
        })
      );
      
      return beatCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.beatId);
    } catch (error) {
      logger.debug('Failed to get trending from cache');
      return [];
    }
  }

  /**
   * Clear analytics cache (useful for testing or cache invalidation)
   */
  static async clearCache(): Promise<void> {
    if (!replitDB) return;
    
    try {
      const keys = await replitDB.list();
      const analyticsKeys = keys.filter(key => 
        key.startsWith('beat_stats_') || key.startsWith('realtime_')
      );
      
      await Promise.all(analyticsKeys.map(key => replitDB.delete(key)));
      logger.info(`Cleared ${analyticsKeys.length} cache entries`);
    } catch (error) {
      logger.error('Failed to clear cache', { error: error.message });
    }
  }
}
