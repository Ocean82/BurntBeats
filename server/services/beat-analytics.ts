
import fs from 'fs/promises';
import path from 'path';

interface BeatPlay {
  beatId: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

interface BeatStats {
  beatId: string;
  title?: string;
  totalPlays: number;
  uniquePlays: number;
  lastPlayed: string;
  playHistory: BeatPlay[];
  dailyPlays: Record<string, number>;
  popularityScore: number;
}

export class BeatAnalytics {
  private static cache: Record<string, BeatStats> = {};
  private static cacheExpiry = 60_000; // 1 minute

  // Clear cache every minute
  static {
    setInterval(() => {
      this.cache = {};
    }, this.cacheExpiry);
  }

  private static async ensureDataDir(): Promise<string> {
    const dataDir = path.join(process.cwd(), 'uploads/analytics');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    return dataDir;
  }

  private static async loadBeatStats(beatId: string): Promise<BeatStats> {
    const cacheKey = `beat_${beatId}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const dataDir = await this.ensureDataDir();
    const statsFile = path.join(dataDir, `${beatId}_analytics.json`);

    try {
      const data = await fs.readFile(statsFile, 'utf8');
      const stats = JSON.parse(data);
      this.cache[cacheKey] = stats;
      return stats;
    } catch (error) {
      // File doesn't exist, create new stats
      const newStats: BeatStats = {
        beatId,
        totalPlays: 0,
        uniquePlays: 0,
        lastPlayed: new Date().toISOString(),
        playHistory: [],
        dailyPlays: {},
        popularityScore: 0
      };
      this.cache[cacheKey] = newStats;
      return newStats;
    }
  }

  private static async saveBeatStats(stats: BeatStats): Promise<void> {
    const dataDir = await this.ensureDataDir();
    const statsFile = path.join(dataDir, `${stats.beatId}_analytics.json`);
    
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
    
    // Update cache
    const cacheKey = `beat_${stats.beatId}`;
    this.cache[cacheKey] = stats;
  }

  static async recordPlay(
    beatId: string, 
    userId?: string, 
    sessionId?: string
  ): Promise<void> {
    try {
      const stats = await this.loadBeatStats(beatId);
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Create play record
      const play: BeatPlay = {
        beatId,
        timestamp: now.toISOString(),
        userId,
        sessionId
      };

      // Update stats
      stats.totalPlays += 1;
      stats.lastPlayed = now.toISOString();
      stats.playHistory.push(play);

      // Update daily plays
      stats.dailyPlays[today] = (stats.dailyPlays[today] || 0) + 1;

      // Calculate unique plays (rough estimation based on userId/sessionId)
      const uniqueIdentifiers = new Set(
        stats.playHistory
          .filter(p => p.userId || p.sessionId)
          .map(p => p.userId || p.sessionId)
      );
      stats.uniquePlays = uniqueIdentifiers.size;

      // Calculate popularity score (weighted by recency and frequency)
      const recentPlays = stats.playHistory.filter(p => {
        const playDate = new Date(p.timestamp);
        const daysDiff = (now.getTime() - playDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Last 7 days
      }).length;

      stats.popularityScore = (recentPlays * 2) + (stats.totalPlays * 0.1) + (stats.uniquePlays * 1.5);

      // Keep only last 1000 plays to prevent file bloat
      if (stats.playHistory.length > 1000) {
        stats.playHistory = stats.playHistory.slice(-1000);
      }

      await this.saveBeatStats(stats);

      console.log(`📊 Play recorded for beat ${beatId} - Total: ${stats.totalPlays}, Score: ${stats.popularityScore.toFixed(2)}`);
    } catch (error) {
      console.error('Failed to record beat play:', error);
    }
  }

  static async getTopBeats(limit: number = 10): Promise<BeatStats[]> {
    try {
      const dataDir = await this.ensureDataDir();
      const files = await fs.readdir(dataDir);
      const analyticsFiles = files.filter(f => f.endsWith('_analytics.json'));

      const allStats: BeatStats[] = [];

      for (const file of analyticsFiles) {
        try {
          const data = await fs.readFile(path.join(dataDir, file), 'utf8');
          const stats = JSON.parse(data);
          allStats.push(stats);
        } catch (error) {
          console.error(`Failed to load analytics file ${file}:`, error);
        }
      }

      // Sort by popularity score descending
      return allStats
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get top beats:', error);
      return [];
    }
  }

  static async getBeatStats(beatId: string): Promise<BeatStats | null> {
    try {
      return await this.loadBeatStats(beatId);
    } catch (error) {
      console.error(`Failed to get stats for beat ${beatId}:`, error);
      return null;
    }
  }

  static async getTrendingBeats(days: number = 7, limit: number = 10): Promise<BeatStats[]> {
    try {
      const allBeats = await this.getTopBeats(100); // Get more to analyze trends
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const trendingBeats = allBeats.map(beat => {
        const recentPlays = beat.playHistory.filter(play => 
          new Date(play.timestamp) >= cutoffDate
        ).length;

        return {
          ...beat,
          recentPlays,
          trendScore: recentPlays + (beat.uniquePlays * 0.5)
        };
      });

      return trendingBeats
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get trending beats:', error);
      return [];
    }
  }

  static async getAnalyticsSummary(): Promise<{
    totalBeats: number;
    totalPlays: number;
    totalUniqueListeners: number;
    averagePopularityScore: number;
  }> {
    try {
      const allBeats = await this.getTopBeats(1000); // Get all beats
      
      const totalBeats = allBeats.length;
      const totalPlays = allBeats.reduce((sum, beat) => sum + beat.totalPlays, 0);
      const totalUniqueListeners = new Set(
        allBeats.flatMap(beat => 
          beat.playHistory
            .filter(p => p.userId || p.sessionId)
            .map(p => p.userId || p.sessionId)
        )
      ).size;
      const averagePopularityScore = totalBeats > 0 
        ? allBeats.reduce((sum, beat) => sum + beat.popularityScore, 0) / totalBeats 
        : 0;

      return {
        totalBeats,
        totalPlays,
        totalUniqueListeners,
        averagePopularityScore
      };
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return {
        totalBeats: 0,
        totalPlays: 0,
        totalUniqueListeners: 0,
        averagePopularityScore: 0
      };
    }
  }
}
