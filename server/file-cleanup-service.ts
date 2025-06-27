import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export interface FileCleanupOptions {
  maxAge: number; // in milliseconds
  checkInterval: number; // in milliseconds
  directories: string[];
  excludePatterns?: RegExp[];
  dryRun?: boolean; // New: preview deletions without actually deleting
  verbose?: boolean; // New: log detailed info
}

export class FileCleanupService {
  private options: FileCleanupOptions;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(options: FileCleanupOptions) {
    this.options = {
      dryRun: false,
      verbose: false,
      ...options
    };
  }

  async start(): Promise<void> {
    if (this.intervalId) {
      this.log('File cleanup service already running');
      return;
    }

    this.log('🗑️  Starting file cleanup service...');
    this.log(`🕒 Cleanup interval: ${this.formatDuration(this.options.checkInterval)}`);
    this.log(`⏰ File max age: ${this.formatDuration(this.options.maxAge)}`);

    // Initial cleanup
    await this.cleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) {
        this.isRunning = true;
        await this.cleanup();
        this.isRunning = false;
      }
    }, this.options.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.log('🛑 File cleanup service stopped');
    }
  }

  async cleanup(): Promise<{ deletedCount: number; freedBytes: number }> {
    try {
      this.log('🧹 Running file cleanup...');
      let totalDeleted = 0;
      let totalFreed = 0;

      for (const directory of this.options.directories) {
        const result = await this.cleanupDirectory(directory);
        totalDeleted += result.deletedCount;
        totalFreed += result.freedBytes;
      }

      if (totalDeleted > 0) {
        this.log(`✅ Cleanup completed: ${totalDeleted} files deleted (${this.formatBytes(totalFreed)} freed)`);
      } else {
        this.log('✅ Cleanup completed: No files to delete');
      }

      return { deletedCount: totalDeleted, freedBytes: totalFreed };
    } catch (error) {
      this.log('❌ File cleanup error:', error);
      return { deletedCount: 0, freedBytes: 0 };
    }
  }

  private async cleanupDirectory(directory: string): Promise<{ deletedCount: number; freedBytes: number }> {
    let deletedCount = 0;
    let freedBytes = 0;

    try {
      if (!await this.pathExists(directory)) {
        return { deletedCount, freedBytes };
      }

      const files = await fs.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);

        try {
          const stats = await fs.stat(filePath);

          // Skip directories
          if (stats.isDirectory()) {
            continue;
          }

          // Check exclude patterns
          if (this.isExcluded(file)) {
            this.log(`↩️ Skipping excluded file: ${file}`);
            continue;
          }

          // Check file age
          const fileAge = now - stats.mtimeMs;
          if (fileAge > this.options.maxAge) {
            this.log(`🗑️  ${this.options.dryRun ? '[DRY RUN] Would delete' : 'Deleting'} old file: ${file} (age: ${this.formatDuration(fileAge)})`);

            if (!this.options.dryRun) {
              await fs.unlink(filePath);
              deletedCount++;
              freedBytes += stats.size;
            }
          }
        } catch (error) {
          this.log(`❌ Error processing file ${file}:`, error);
        }
      }
    } catch (error) {
      this.log(`❌ Error cleaning up directory ${directory}:`, error);
    }

    return { deletedCount, freedBytes };
  }

  // Enhanced pattern cleanup with glob support
  async cleanupPattern(pattern: string, directory?: string): Promise<number> {
    const searchPath = directory ? path.join(directory, pattern) : pattern;
    let deletedCount = 0;

    try {
      const files = await glob(searchPath, { nodir: true });

      for (const file of files) {
        try {
          if (!this.isExcluded(path.basename(file))) {
            this.log(`🗑️  ${this.options.dryRun ? '[DRY RUN] Would delete' : 'Deleting'}: ${file}`);

            if (!this.options.dryRun) {
              await fs.unlink(file);
              deletedCount++;
            }
          }
        } catch (error) {
          this.log(`❌ Error deleting ${file}:`, error);
        }
      }
    } catch (error) {
      this.log('❌ Pattern cleanup error:', error);
    }

    return deletedCount;
  }

  // Enhanced orphaned files cleanup
  async cleanupOrphanedFiles(referenceCheck: (filename: string) => Promise<boolean>): Promise<number> {
    let orphanedCount = 0;

    for (const directory of this.options.directories) {
      try {
        if (!await this.pathExists(directory)) continue;

        const files = await fs.readdir(directory);

        for (const file of files) {
          const filePath = path.join(directory, file);

          try {
            // Skip directories and excluded files
            if ((await fs.stat(filePath)).isDirectory() || this.isExcluded(file)) {
              continue;
            }

            // Check if file is referenced
            const isReferenced = await referenceCheck(file);
            if (!isReferenced) {
              const fileAge = Date.now() - (await fs.stat(filePath)).mtimeMs;

              // Only delete if older than 1 hour (avoid active files)
              if (fileAge > 60 * 60 * 1000) {
                this.log(`🗑️  ${this.options.dryRun ? '[DRY RUN] Would delete' : 'Deleting'} orphaned file: ${file}`);

                if (!this.options.dryRun) {
                  await fs.unlink(filePath);
                  orphanedCount++;
                }
              }
            }
          } catch (error) {
            this.log(`❌ Error processing orphaned file ${file}:`, error);
          }
        }
      } catch (error) {
        this.log(`❌ Error cleaning orphaned files in ${directory}:`, error);
      }
    }

    if (orphanedCount > 0) {
      this.log(`✅ Cleaned up ${orphanedCount} orphaned files`);
    }

    return orphanedCount;
  }

  // Utility methods
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private isExcluded(filename: string): boolean {
    return !!this.options.excludePatterns?.some(pattern => pattern.test(filename));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatDuration(ms: number): string {
    if (ms < 60000) return Math.round(ms / 1000) + 's';
    if (ms < 3600000) return Math.round(ms / 60000) + 'm';
    if (ms < 86400000) return Math.round(ms / 3600000) + 'h';
    return Math.round(ms / 86400000) + 'd';
  }

  private log(...args: any[]): void {
    if (this.options.verbose) {
      console.log('[Cleanup]', ...args);
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
    /^demo_/,
    /^sample_/,
    /\.keep$/,
    /^\.gitkeep/,
    /^readme\.md$/i
  ],
  dryRun: false,
  verbose: true
};

// Singleton instance
export const fileCleanupService = new FileCleanupService(defaultCleanupConfig);
