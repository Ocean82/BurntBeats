
import fs from 'fs';
import path from 'path';

export interface FileCleanupOptions {
  maxAge: number; // in milliseconds
  checkInterval: number; // in milliseconds
  directories: string[];
  excludePatterns?: RegExp[];
}

export class FileCleanupService {
  private options: FileCleanupOptions;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(options: FileCleanupOptions) {
    this.options = options;
  }

  start(): void {
    if (this.intervalId) {
      console.log('File cleanup service already running');
      return;
    }

    console.log('🗑️  Starting file cleanup service...');
    console.log(`🕒 Cleanup interval: ${this.options.checkInterval / 1000 / 60} minutes`);
    console.log(`⏰ File max age: ${this.options.maxAge / 1000 / 60 / 60} hours`);

    // Run initial cleanup
    this.cleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, this.options.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 File cleanup service stopped');
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Running file cleanup...');
      let totalDeleted = 0;
      let totalSize = 0;

      for (const directory of this.options.directories) {
        const result = await this.cleanupDirectory(directory);
        totalDeleted += result.deletedCount;
        totalSize += result.deletedSize;
      }

      if (totalDeleted > 0) {
        console.log(`✅ Cleanup completed: ${totalDeleted} files deleted (${(totalSize / 1024 / 1024).toFixed(2)} MB freed)`);
      } else {
        console.log('✅ Cleanup completed: No files to delete');
      }
    } catch (error) {
      console.error('❌ File cleanup error:', error);
    }
  }

  private async cleanupDirectory(directory: string): Promise<{ deletedCount: number; deletedSize: number }> {
    let deletedCount = 0;
    let deletedSize = 0;

    if (!fs.existsSync(directory)) {
      return { deletedCount, deletedSize };
    }

    const files = fs.readdirSync(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      
      try {
        const stats = fs.statSync(filePath);
        
        // Skip directories
        if (stats.isDirectory()) {
          continue;
        }

        // Check if file matches exclude patterns
        const shouldExclude = this.options.excludePatterns?.some(pattern => 
          pattern.test(file)
        );
        
        if (shouldExclude) {
          continue;
        }

        // Check if file is older than maxAge
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > this.options.maxAge) {
          console.log(`🗑️  Deleting old file: ${file} (age: ${Math.round(fileAge / 1000 / 60 / 60)}h)`);
          
          deletedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file}:`, error);
      }
    }

    return { deletedCount, deletedSize };
  }

  // Manual cleanup method for specific patterns
  async cleanupPattern(directory: string, pattern: RegExp): Promise<number> {
    if (!fs.existsSync(directory)) {
      return 0;
    }

    const files = fs.readdirSync(directory);
    let deletedCount = 0;

    for (const file of files) {
      if (pattern.test(file)) {
        const filePath = path.join(directory, file);
        
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️  Deleted: ${file}`);
        } catch (error) {
          console.error(`❌ Error deleting ${file}:`, error);
        }
      }
    }

    return deletedCount;
  }

  // Cleanup orphaned files (files not referenced in database)
  async cleanupOrphanedFiles(): Promise<void> {
    try {
      const { storage } = await import('./storage');
      const songs = await storage.getUserSongs('all'); // Get all songs
      
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        return;
      }

      // Get all referenced audio files
      const referencedFiles = new Set<string>();
      songs.forEach(song => {
        if (song.generatedAudioPath) {
          const filename = path.basename(song.generatedAudioPath);
          referencedFiles.add(filename);
        }
      });

      // Check for orphaned files
      const files = fs.readdirSync(uploadsDir);
      let orphanedCount = 0;

      for (const file of files) {
        // Skip non-audio files
        if (!/\.(mp3|wav|m4a|ogg)$/i.test(file)) {
          continue;
        }

        // Check if file is referenced in database
        if (!referencedFiles.has(file)) {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          
          // Only delete if file is older than 1 hour (to avoid deleting files mid-generation)
          const fileAge = Date.now() - stats.mtime.getTime();
          if (fileAge > 60 * 60 * 1000) { // 1 hour
            fs.unlinkSync(filePath);
            orphanedCount++;
            console.log(`🗑️  Deleted orphaned file: ${file}`);
          }
        }
      }

      if (orphanedCount > 0) {
        console.log(`✅ Cleaned up ${orphanedCount} orphaned audio files`);
      }
    } catch (error) {
      console.error('❌ Orphaned file cleanup error:', error);
    }
  }
}

// Default configuration
export const defaultCleanupConfig: FileCleanupOptions = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  checkInterval: 6 * 60 * 60 * 1000, // 6 hours
  directories: [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'temp')
  ],
  excludePatterns: [
    /^demo_/, // Exclude demo files
    /^sample_/, // Exclude sample files
    /\.keep$/ // Exclude .keep files
  ]
};

// Create and export singleton instance
export const fileCleanupService = new FileCleanupService(defaultCleanupConfig);
