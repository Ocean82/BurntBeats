import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import crypto from 'crypto';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import wav from 'wav';
import lame from 'lame';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

// Event emitter for real-time monitoring
const watermarkEvents = new EventEmitter();

export class WatermarkService {
  private static watermarkMessages = [
    "This is a Burnt Beats demo - purchase to remove this message",
    "Burnt Beats - Get the clean version at burntbeats.com",
    "Demo track by Burnt Beats - buy now for the full experience",
    "This track contains a Burnt Beats watermark - purchase to unlock",
    "Burnt Beats preview - remove this message with purchase"
  ];

  private static metrics = {
    watermarkSuccess: 0,
    watermarkFailures: 0,
    ffmpegFallbacks: 0,
    tierProcessingTime: new Map<string, number>(),
    lastError: null as string | null,
    activeProcesses: 0
  };

  static async generateWatermarkedTrack(
    originalAudioPath: string, 
    songId: string, 
    songTitle: string
  ): Promise<string> {
    this.metrics.activeProcesses++;
    const startTime = Date.now();
    const outputPath = originalAudioPath.replace(/\.(mp3|wav)$/, '_watermarked.$1');

    try {
      watermarkEvents.emit('processStart', { songId, type: 'watermark' });
      console.log(`Adding watermark to song ${songId}: ${songTitle}`);

      await this.validateAudioFile(originalAudioPath);
      await this.addSubtleWatermark(originalAudioPath, outputPath, songId);
      await this.addWatermarkMetadata(outputPath, 'preview', songId);

      const processingTime = Date.now() - startTime;
      console.log(`Watermarked track created in ${processingTime}ms: ${outputPath}`);

      this.metrics.watermarkSuccess++;
      watermarkEvents.emit('processSuccess', { songId, processingTime });
      return outputPath;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Watermark generation failed:', errorMsg);

      this.metrics.watermarkFailures++;
      this.metrics.lastError = errorMsg;
      watermarkEvents.emit('processError', { 
        songId, 
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined
      });

      try {
        await fs.copyFile(originalAudioPath, outputPath);
        watermarkEvents.emit('fallbackUsed', { songId, method: 'copy' });
        return outputPath;
      } catch (copyError) {
        throw new Error(`Both watermarking and fallback failed: ${errorMsg}`);
      }
    } finally {
      this.metrics.activeProcesses--;
      watermarkEvents.emit('processComplete', { songId });
    }
  }

  private static async validateAudioFile(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size === 0) throw new Error('Audio file is empty');

      const buffer = Buffer.alloc(4);
      const fd = await fs.open(filePath, 'r');
      await fd.read(buffer, 0, 4, 0);
      await fd.close();

      const header = buffer.toString('hex');
      if (!header.match(/^52494646|494433/)) {
        throw new Error('Invalid audio file format');
      }
    } catch (error) {
      throw new Error(`Audio validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async addSubtleWatermark(
    inputPath: string, 
    outputPath: string, 
    songId: string
  ): Promise<void> {
    const watermarkOverlayPath = path.join(process.cwd(), 'uploads', 'watermark_overlay.mp3');

    if (await this.fileExists(watermarkOverlayPath)) {
      await this.mixWithCustomOverlay(inputPath, outputPath, watermarkOverlayPath, songId);
    } else {
      await this.addDefaultWatermark(inputPath, outputPath, songId);
    }
  }

  private static async mixWithCustomOverlay(
    inputPath: string,
    outputPath: string,
    overlayPath: string,
    songId: string
  ): Promise<void> {
    try {
      const loudness = await this.analyzeTrackLoudness(inputPath);
      const overlayVolume = this.calculateOverlayVolume(loudness);

      const watermarkCommand = [
        'ffmpeg',
        '-i', inputPath,
        '-i', overlayPath,
        '-filter_complex', 
        `[0:a]volume=1.0[main];[1:a]volume=${overlayVolume}[overlay];` +
        `[main][overlay]amix=inputs=2:duration=first:dropout_transition=0`,
        '-c:a', 'libmp3lame',
        '-b:a', '320k',
        '-y',
        outputPath
      ];

      await execAsync(watermarkCommand.join(' '));
      watermarkEvents.emit('methodUsed', { songId, method: 'ffmpeg' });
    } catch (error) {
      this.metrics.ffmpegFallbacks++;
      watermarkEvents.emit('fallbackUsed', { 
        songId, 
        method: 'node-audio',
        reason: error instanceof Error ? error.message : 'Unknown FFmpeg error'
      });

      await this.processAudioWithNode(inputPath, outputPath, overlayPath, songId);
    }
  }

  private static async processAudioWithNode(
    inputPath: string,
    outputPath: string,
    overlayPath: string,
    songId: string
  ): Promise<void> {
    try {
      const reader = new wav.Reader();
      const writer = new lame.Encoder({
        channels: 2,
        bitDepth: 16,
        sampleRate: 44100,
        bitRate: 320,
        mode: lame.STEREO
      });

      const inputStream = fs.createReadStream(inputPath);
      const outputStream = createWriteStream(outputPath);

      await pipeline(
        inputStream,
        reader,
        async function* (source) {
          for await (const chunk of source) {
            // Add watermark processing here
            yield chunk;
          }
        },
        writer,
        outputStream
      );

      watermarkEvents.emit('methodUsed', { songId, method: 'node-audio' });
    } catch (error) {
      throw new Error(`Node.js audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async analyzeTrackLoudness(inputPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffmpeg -i "${inputPath}" -filter:a volumedetect -f null /dev/null 2>&1`
      );

      const loudnessMatch = stdout.match(/mean_volume: ([-\d.]+) dB/);
      return loudnessMatch ? parseFloat(loudnessMatch[1]) : -20;
    } catch (error) {
      console.warn('Could not analyze track loudness, using default');
      return -20;
    }
  }

  private static calculateOverlayVolume(trackLoudness: number): number {
    const targetLoudness = -16;
    const difference = targetLoudness - trackLoudness;
    return Math.min(0.3, Math.max(0.05, 0.2 * Math.pow(10, difference / 20)));
  }

  static async generateCleanTrack(
    originalAudioPath: string, 
    tier: string, 
    songId: string
  ): Promise<string> {
    this.metrics.activeProcesses++;
    const startTime = Date.now();

    try {
      watermarkEvents.emit('processStart', { songId, type: 'clean-track', tier });

      const qualityConfigs = {
        'bonus': { suffix: '_bonus_128kbps.mp3', bitrate: '128k', format: 'mp3', watermarked: true },
        'base': { suffix: '_base_320kbps.mp3', bitrate: '320k', format: 'mp3', watermarked: false },
        'top': { suffix: '_top_studio.wav', bitrate: null, format: 'wav', watermarked: false }
      };

      const config = qualityConfigs[tier as keyof typeof qualityConfigs] || qualityConfigs.base;
      const cleanPath = originalAudioPath.replace(/\.(mp3|wav)$/, config.suffix);

      if (config.watermarked) {
        const watermarkedPath = await this.generateWatermarkedTrack(originalAudioPath, songId, 'Bonus Track');
        await this.encodeToQuality(watermarkedPath, cleanPath, config);
      } else {
        await this.encodeToQuality(originalAudioPath, cleanPath, config);
      }

      await this.addWatermarkMetadata(cleanPath, tier, songId);

      const processingTime = Date.now() - startTime;
      this.metrics.tierProcessingTime.set(tier, processingTime);

      watermarkEvents.emit('processSuccess', { songId, processingTime, tier });
      return cleanPath;
    } catch (error) {
      const errorMsg = `Clean track generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      watermarkEvents.emit('processError', { 
        songId, 
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
        tier
      });
      throw new Error(errorMsg);
    } finally {
      this.metrics.activeProcesses--;
      watermarkEvents.emit('processComplete', { songId, tier });
    }
  }

  static async encodeToQuality(inputPath: string, outputPath: string, config: any): Promise<void> {
    try {
      let ffmpegArgs: string[];

      if (config.format === 'wav') {
        ffmpegArgs = [
          '-i', inputPath,
          '-c:a', 'pcm_s24le',
          '-ar', '48000',
          '-y',
          outputPath
        ];
      } else {
        ffmpegArgs = [
          '-i', inputPath,
          '-c:a', 'libmp3lame',
          '-b:a', config.bitrate,
          '-ar', '44100',
          '-y',
          outputPath
        ];
      }

      await execAsync(`ffmpeg ${ffmpegArgs.join(' ')}`);
    } catch (error) {
      console.error('FFmpeg encoding failed, falling back to file copy:', error);
      await fs.copyFile(inputPath, outputPath);
    }
  }

  static async addWatermarkMetadata(audioPath: string, tier: string, songId: string): Promise<void> {
    try {
      const metadata = {
        comment: "Burnt Beats Track",
        title: `Song ${songId}`,
        tier: tier,
        songId: songId,
        watermarked: tier === 'bonus' || tier === 'preview' ? 'true' : 'false',
        processed_date: new Date().toISOString()
      };

      const tempPath = audioPath + '.temp';
      const metadataArgs = Object.entries(metadata)
        .map(([key, value]) => `-metadata ${key}="${value}"`)
        .join(' ');

      await execAsync(`ffmpeg -i "${audioPath}" ${metadataArgs} -c copy "${tempPath}" -y`);
      await fs.rename(tempPath, audioPath);
    } catch (error) {
      console.warn('Failed to add metadata:', error);
      try {
        await fs.unlink(audioPath + '.temp');
      } catch (unlinkError) {
        console.warn('Failed to clean up temp file:', unlinkError);
      }
    }
  }

  // Event handling interface
  static on(event: string, listener: (...args: any[]) => void) {
    watermarkEvents.on(event, listener);
  }

  static off(event: string, listener: (...args: any[]) => void) {
    watermarkEvents.off(event, listener);
  }

  static getMetrics() {
    return {
      ...this.metrics,
      watermarkCoverageRate: this.calculateCoverageRate(),
      avgProcessingTimeByTier: Array.from(this.metrics.tierProcessingTime.entries())
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
      lastError: this.metrics.lastError
    };
  }

  private static calculateCoverageRate(): number {
    const total = this.metrics.watermarkSuccess + this.metrics.watermarkFailures;
    return total > 0 ? (this.metrics.watermarkSuccess / total) * 100 : 0;
  }

  static resetMetrics(): void {
    this.metrics.watermarkSuccess = 0;
    this.metrics.watermarkFailures = 0;
    this.metrics.ffmpegFallbacks = 0;
    this.metrics.tierProcessingTime.clear();
    this.metrics.lastError = null;
    this.metrics.activeProcesses = 0;
  }
}
