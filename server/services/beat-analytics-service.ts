
import { Logger } from '../utils/logger';
import { env } from '../config/env';
import { BeatAnalytics } from './beat-analytics';

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
      await BeatAnalytics.recordPlay(beatId, userId, sessionId);
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
}
