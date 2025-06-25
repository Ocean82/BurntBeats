
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class AudioPreviewService {
  private readonly previewsDir = path.join(process.cwd(), 'uploads', 'previews');
  private readonly watermarkAudio = path.join(process.cwd(), 'server', 'assets', 'watermark.mp3');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.previewsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create previews directory:', error);
    }
  }

  /**
   * Generate a watermarked preview of the audio file
   * @param originalAudioPath Path to the original audio file
   * @param songId Unique identifier for the song
   * @param previewDuration Duration of preview in seconds (default: 30)
   * @returns Path to the watermarked preview file
   */
  async generateWatermarkedPreview(
    originalAudioPath: string,
    songId: string,
    previewDuration: number = 30
  ): Promise<string> {
    const previewPath = path.join(this.previewsDir, `preview_${songId}.mp3`);
    
    try {
      // Check if preview already exists
      try {
        await fs.access(previewPath);
        return previewPath;
      } catch {
        // File doesn't exist, continue with generation
      }

      // Generate preview with watermark using ffmpeg
      await this.createWatermarkedAudio(originalAudioPath, previewPath, previewDuration);
      
      console.log(`✅ Generated watermarked preview: ${previewPath}`);
      return previewPath;
      
    } catch (error) {
      console.error('Error generating watermarked preview:', error);
      throw new Error(`Failed to generate preview: ${error.message}`);
    }
  }

  private async createWatermarkedAudio(
    inputPath: string,
    outputPath: string,
    duration: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a synthetic watermark audio if the file doesn't exist
      const watermarkCommand = this.buildWatermarkCommand(inputPath, outputPath, duration);
      
      const ffmpeg = spawn('ffmpeg', watermarkCommand, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private buildWatermarkCommand(inputPath: string, outputPath: string, duration: number): string[] {
    // Build ffmpeg command for watermarked preview
    return [
      '-i', inputPath,
      '-t', duration.toString(),
      '-af', [
        // Reduce volume slightly
        'volume=0.8',
        // Add subtle distortion every 10 seconds
        'aeval=val(0)*if(mod(t\\,10)<0.5\\,0.9\\,1.0)',
        // Add high-frequency watermark tone (barely audible)
        'aeval=val(0)+0.02*sin(2*PI*15000*t)',
      ].join(','),
      '-c:a', 'mp3',
      '-b:a', '128k',
      '-ar', '44100',
      '-y', // Overwrite output
      outputPath
    ];
  }

  /**
   * Generate a simple preview without watermark (for premium users)
   */
  async generateCleanPreview(
    originalAudioPath: string,
    songId: string,
    previewDuration: number = 30
  ): Promise<string> {
    const previewPath = path.join(this.previewsDir, `clean_preview_${songId}.mp3`);
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', originalAudioPath,
        '-t', previewDuration.toString(),
        '-c:a', 'mp3',
        '-b:a', '192k',
        '-y',
        previewPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(previewPath);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  /**
   * Check if a preview exists for a song
   */
  async hasPreview(songId: string, isWatermarked: boolean = true): Promise<boolean> {
    const prefix = isWatermarked ? 'preview_' : 'clean_preview_';
    const previewPath = path.join(this.previewsDir, `${prefix}${songId}.mp3`);
    
    try {
      await fs.access(previewPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get preview file path
   */
  getPreviewPath(songId: string, isWatermarked: boolean = true): string {
    const prefix = isWatermarked ? 'preview_' : 'clean_preview_';
    return path.join(this.previewsDir, `${prefix}${songId}.mp3`);
  }

  /**
   * Clean up old preview files
   */
  async cleanupOldPreviews(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.previewsDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(this.previewsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          console.log(`🧹 Cleaned up old preview: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up previews:', error);
    }
  }
}

export const audioPreviewService = new AudioPreviewService();
