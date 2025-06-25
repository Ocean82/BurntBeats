
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import crypto from 'crypto';

const execAsync = promisify(exec);

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
    tierProcessingTime: new Map<string, number>()
  };

  static async generateWatermarkedTrack(originalAudioPath: string, songId: string, songTitle: string): Promise<string> {
    try {
      console.log(`Adding watermark to song ${songId}: ${songTitle}`);
      
      const watermarkedPath = originalAudioPath.replace('.mp3', '_watermarked.mp3').replace('.wav', '_watermarked.wav');
      
      // Add subtle audio watermark overlay that preserves musical quality
      await this.addSubtleWatermark(originalAudioPath, watermarkedPath, songId);
      
      // Add metadata tags
      await this.addWatermarkMetadata(watermarkedPath, 'preview', songId);
      
      console.log(`Watermarked track created: ${watermarkedPath}`);
      this.metrics.watermarkSuccess++;
      return watermarkedPath;
    } catch (error) {
      console.error('Watermark generation failed:', error);
      this.metrics.watermarkFailures++;
      this.emitMetric('watermarkFailed', { songId, error: error.message });
      
      // Fallback to copying original file
      const watermarkedPath = originalAudioPath.replace('.mp3', '_watermarked.mp3').replace('.wav', '_watermarked.wav');
      if (fs.existsSync(originalAudioPath)) {
        fs.copyFileSync(originalAudioPath, watermarkedPath);
      }
      return watermarkedPath;
    }
  }

  private static async addSubtleWatermark(inputPath: string, outputPath: string, songId: string): Promise<void> {
    // Check if custom watermark overlay exists
    const watermarkOverlayPath = path.join(process.cwd(), 'uploads', 'watermark_overlay.mp3');
    
    if (fs.existsSync(watermarkOverlayPath)) {
      console.log('Using custom watermark overlay');
      await this.mixWithCustomOverlay(inputPath, outputPath, watermarkOverlayPath, songId);
    } else {
      console.log('Using default watermark method');
      await this.addDefaultWatermark(inputPath, outputPath, songId);
    }
  }

  private static async mixWithCustomOverlay(inputPath: string, outputPath: string, overlayPath: string, songId: string): Promise<void> {
    try {
      // First, analyze the track's loudness for dynamic volume adjustment
      const loudness = await this.analyzeTrackLoudness(inputPath);
      const overlayVolume = this.calculateOverlayVolume(loudness);
      
      // Try using ffmpeg for high-quality mixing with proper async handling
      const watermarkCommand = [
        '-i', `"${inputPath}"`,
        '-i', `"${overlayPath}"`,
        '-filter_complex', `"[0:a]volume=1.0[main];[1:a]volume=${overlayVolume}[overlay];[main][overlay]amix=inputs=2:duration=first:dropout_transition=0"`,
        '-c:a', 'mp3',
        '-b:a', '320k',
        '-y',
        `"${outputPath}"`
      ].join(' ');

      await execAsync(`ffmpeg ${watermarkCommand}`);
      console.log('Watermark overlay applied with ffmpeg');
    } catch (error) {
      console.log('FFmpeg not available, using manual mixing');
      this.metrics.ffmpegFallbacks++;
      this.emitMetric('ffmpegFallbackUsed', { songId, reason: error.message });
      await this.manualMixOverlay(inputPath, outputPath, overlayPath, songId);
    }
  }

  private static async analyzeTrackLoudness(inputPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`ffmpeg -i "${inputPath}" -filter:a volumedetect -f null /dev/null 2>&1`);
      const loudnessMatch = stdout.match(/mean_volume: ([-\d.]+) dB/);
      return loudnessMatch ? parseFloat(loudnessMatch[1]) : -20; // Default to -20dB if can't detect
    } catch (error) {
      console.warn('Could not analyze track loudness, using default');
      return -20; // Safe default
    }
  }

  private static calculateOverlayVolume(trackLoudness: number): number {
    // Dynamic volume adjustment based on track loudness
    // Louder tracks get quieter watermarks, quieter tracks get slightly louder watermarks
    const baseVolume = 0.15;
    const adjustment = Math.max(-0.1, Math.min(0.1, (trackLoudness + 20) / 100));
    return Math.max(0.05, Math.min(0.3, baseVolume - adjustment));
  }

  private static async manualMixOverlay(inputPath: string, outputPath: string, overlayPath: string, songId: string): Promise<void> {
    // Manual audio mixing (simplified approach)
    // For now, copy the main audio and add subtle periodic watermark
    const inputData = fs.readFileSync(inputPath);
    const watermarkedData = Buffer.from(inputData);
    
    // Parse WAV header
    const sampleRate = inputData.readUInt32LE(24);
    const channels = inputData.readUInt16LE(22);
    const headerSize = 44;
    
    // Add periodic watermark sounds every 20 seconds
    await this.addPeriodicWatermarkSounds(watermarkedData, headerSize, sampleRate, channels, songId);
    
    fs.writeFileSync(outputPath, watermarkedData);
  }

  private static async addPeriodicWatermarkSounds(audioData: Buffer, headerSize: number, sampleRate: number, channels: number, songId: string): Promise<void> {
    const audioSection = audioData.slice(headerSize);
    const interval = sampleRate * 20 * channels * 2; // Every 20 seconds
    const duration = sampleRate * 1.5 * channels * 2; // 1.5 second watermark sound
    
    for (let pos = headerSize; pos < audioData.length; pos += interval) {
      // Add a subtle "whoosh" sound that indicates this is a preview
      this.addWhooshSound(audioData, pos, Math.min(duration, audioData.length - pos), sampleRate, channels, songId);
    }
  }

  private static addWhooshSound(audioData: Buffer, startPos: number, duration: number, sampleRate: number, channels: number, songId: string): void {
    // Create a subtle "whoosh" or "swoosh" sound that's clearly audible but not too intrusive
    for (let i = 0; i < duration && startPos + i < audioData.length; i += channels * 2) {
      const sampleIndex = i / (channels * 2);
      const t = sampleIndex / sampleRate;
      const durationInSeconds = duration / (sampleRate * channels * 2);
      
      // Create a frequency sweep that sounds like a "whoosh"
      const freqStart = 800;
      const freqEnd = 200;
      const currentFreq = freqStart + (freqEnd - freqStart) * (t / durationInSeconds);
      
      // Apply envelope for smooth fade in/out
      const envelope = Math.sin((t / durationInSeconds) * Math.PI);
      
      // Generate the whoosh sound  
      const whooshSample = Math.sin(2 * Math.PI * currentFreq * t) * envelope * 3000; // Lower volume
      
      // Mix with original audio for each channel
      for (let ch = 0; ch < channels; ch++) {
        const samplePos = startPos + i + ch * 2;
        if (samplePos < audioData.length - 1) {
          const originalSample = audioData.readInt16LE(samplePos);
          const mixed = Math.max(-32768, Math.min(32767, originalSample + whooshSample * 0.1)); // Mix at 10% volume
          audioData.writeInt16LE(mixed, samplePos);
        }
      }
    }
  }

  private static async addDefaultWatermark(inputPath: string, outputPath: string, songId: string): Promise<void> {
    const inputData = fs.readFileSync(inputPath);
    
    // Parse WAV header
    const sampleRate = inputData.readUInt32LE(24);
    const channels = inputData.readUInt16LE(22);
    const headerSize = 44;
    const audioData = inputData.slice(headerSize);
    
    // Create watermarked version with subtle overlay
    const watermarkedData = Buffer.from(audioData);
    
    // Add periodic subtle watermark tones every 15 seconds
    const watermarkInterval = sampleRate * 15 * channels * 2; // 15 seconds
    const watermarkDuration = sampleRate * 0.3 * channels * 2; // 0.3 second overlay
    
    for (let pos = 0; pos < watermarkedData.length; pos += watermarkInterval) {
      this.addWatermarkTone(watermarkedData, pos, watermarkDuration, sampleRate, channels, songId);
    }
    
    // Add randomized frequency signature throughout
    this.addRandomizedFrequencySignature(watermarkedData, sampleRate, channels, songId);
    
    // Write watermarked file
    const header = inputData.slice(0, headerSize);
    fs.writeFileSync(outputPath, Buffer.concat([header, watermarkedData]));
  }

  private static addWatermarkTone(audioData: Buffer, startPos: number, duration: number, sampleRate: number, channels: number, songId: string): void {
    // Add a very subtle high-frequency tone that's barely audible but detectable
    const watermarkFreq = 15000; // 15kHz - high but still audible as a subtle "shimmer"
    const amplitude = 1000; // Very quiet
    
    for (let i = 0; i < duration && startPos + i < audioData.length; i += channels * 2) {
      const sampleIndex = i / (channels * 2);
      const t = sampleIndex / sampleRate;
      
      // Create subtle sine wave
      const watermarkSample = Math.sin(2 * Math.PI * watermarkFreq * t) * amplitude;
      
      // Apply envelope (fade in/out) to make it less noticeable
      const envelope = Math.sin((sampleIndex / (duration / (channels * 2))) * Math.PI);
      const finalWatermark = watermarkSample * envelope * 0.1; // Very quiet
      
      // Mix with original audio for each channel
      for (let ch = 0; ch < channels; ch++) {
        const samplePos = startPos + i + ch * 2;
        if (samplePos < audioData.length - 1) {
          const originalSample = audioData.readInt16LE(samplePos);
          const mixed = Math.max(-32768, Math.min(32767, originalSample + finalWatermark));
          audioData.writeInt16LE(mixed, samplePos);
        }
      }
    }
  }

  private static addRandomizedFrequencySignature(audioData: Buffer, sampleRate: number, channels: number, songId: string): void {
    // Generate a song-specific frequency within the range 17.4-17.7kHz
    const hash = crypto.createHash('md5').update(songId).digest('hex');
    const randomSeed = parseInt(hash.slice(0, 8), 16);
    const freqVariation = (randomSeed % 300) / 1000; // 0-0.3 kHz variation
    const signatureFreq = 17400 + freqVariation; // 17.4-17.7kHz range
    
    const amplitude = 300; // Extremely quiet
    const bytesPerSample = channels * 2;
    const totalSamples = audioData.length / bytesPerSample;
    
    console.log(`Adding frequency signature at ${signatureFreq.toFixed(1)}Hz for song ${songId}`);
    
    for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 100) { // Every 100th sample
      const t = sampleIndex / sampleRate;
      const signatureSample = Math.sin(2 * Math.PI * signatureFreq * t) * amplitude * 0.05;
      
      const bytePos = sampleIndex * bytesPerSample;
      if (bytePos < audioData.length - bytesPerSample) {
        // Add to all channels
        for (let ch = 0; ch < channels; ch++) {
          const channelPos = bytePos + ch * 2;
          const originalSample = audioData.readInt16LE(channelPos);
          const mixed = Math.max(-32768, Math.min(32767, originalSample + signatureSample));
          audioData.writeInt16LE(mixed, channelPos);
        }
      }
    }
  }

  static async generateCleanTrack(originalAudioPath: string, tier: string, songId: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log(`Generating clean ${tier} track for song ${songId}`);
      
      // Generate different quality versions based on tier
      const qualityConfigs = {
        'bonus': { suffix: '_bonus_128kbps.mp3', bitrate: '128k', format: 'mp3', watermarked: true },
        'base': { suffix: '_base_320kbps.mp3', bitrate: '320k', format: 'mp3', watermarked: false },
        'top': { suffix: '_top_studio.wav', bitrate: null, format: 'wav', watermarked: false }
      };
      
      const config = qualityConfigs[tier as keyof typeof qualityConfigs] || qualityConfigs['base'];
      const cleanPath = originalAudioPath.replace(/\.(mp3|wav)$/, config.suffix);
      
      if (config.watermarked) {
        // Bonus tier keeps the watermark but is still purchasable at lower quality
        const watermarkedPath = await this.generateWatermarkedTrack(originalAudioPath, songId, 'Bonus Track');
        await this.encodeToQuality(watermarkedPath, cleanPath, config);
        await this.addWatermarkMetadata(cleanPath, tier, songId);
      } else {
        // For Base and Top tiers, generate clean versions with proper encoding
        await this.encodeToQuality(originalAudioPath, cleanPath, config);
        await this.addWatermarkMetadata(cleanPath, tier, songId);
      }
      
      const processingTime = Date.now() - startTime;
      this.metrics.tierProcessingTime.set(tier, processingTime);
      
      console.log(`Clean ${tier} track created: ${cleanPath} (${processingTime}ms)`);
      return cleanPath;
    } catch (error) {
      console.error('Clean track generation failed:', error);
      this.emitMetric('cleanTrackFailed', { songId, tier, error: error.message });
      throw error;
    }
  }

  private static async encodeToQuality(inputPath: string, outputPath: string, config: any): Promise<void> {
    try {
      let ffmpegArgs: string[];
      
      if (config.format === 'wav') {
        // High-quality WAV for top tier
        ffmpegArgs = [
          '-i', `"${inputPath}"`,
          '-c:a', 'pcm_s24le', // 24-bit PCM
          '-ar', '48000',      // 48kHz sample rate
          '-y',
          `"${outputPath}"`
        ];
      } else {
        // MP3 encoding for bonus and base tiers
        ffmpegArgs = [
          '-i', `"${inputPath}"`,
          '-c:a', 'libmp3lame',
          '-b:a', config.bitrate,
          '-ar', '44100',
          '-y',
          `"${outputPath}"`
        ];
      }
      
      await execAsync(`ffmpeg ${ffmpegArgs.join(' ')}`);
      console.log(`Successfully encoded to ${config.format} at ${config.bitrate || '24-bit'}`);
    } catch (error) {
      console.error('FFmpeg encoding failed, falling back to file copy:', error);
      if (fs.existsSync(inputPath)) {
        fs.copyFileSync(inputPath, outputPath);
      }
    }
  }

  private static async addWatermarkMetadata(audioPath: string, tier: string, songId: string): Promise<void> {
    try {
      const metadata = {
        comment: "Burnt Beats Track",
        title: `Song ${songId}`,
        tier: tier,
        songId: songId,
        watermarked: tier === 'bonus' || tier === 'preview' ? 'true' : 'false',
        processed_date: new Date().toISOString()
      };

      // Use ffmpeg to add metadata
      const tempPath = audioPath + '.temp';
      const metadataArgs = Object.entries(metadata)
        .map(([key, value]) => `-metadata ${key}="${value}"`)
        .join(' ');

      await execAsync(`ffmpeg -i "${audioPath}" ${metadataArgs} -c copy "${tempPath}" -y`);
      
      // Replace original with metadata-enhanced version
      fs.renameSync(tempPath, audioPath);
      console.log(`Added metadata to ${audioPath}:`, metadata);
    } catch (error) {
      console.warn('Failed to add metadata:', error);
      // Clean up temp file if it exists
      const tempPath = audioPath + '.temp';
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  static getRandomWatermarkMessage(): string {
    return this.watermarkMessages[Math.floor(Math.random() * this.watermarkMessages.length)];
  }

  static addWatermarkToAudio(audioBuffer: Buffer, message: string): Buffer {
    // Placeholder for actual audio watermarking
    // In a real implementation, you would:
    // 1. Convert message to speech using TTS
    // 2. Mix the watermark into the audio at regular intervals
    // 3. Apply audio processing to make removal difficult
    // 4. Return the watermarked audio buffer
    
    console.log(`Adding watermark: "${message}"`);
    return audioBuffer; // Return original for now
  }

  static removeWatermarkMetadata(audioPath: string): void {
    // Remove any metadata that might indicate watermark presence
    console.log(`Cleaning metadata for: ${audioPath}`);
    
    // In real implementation:
    // 1. Strip metadata tags
    // 2. Remove any watermark indicators
    // 3. Clean up audio artifacts if needed
  }

  static validatePurchaseForCleanTrack(sessionId: string, tier: string): boolean {
    // Validate that the purchase was successful and user can access clean track
    console.log(`Validating purchase ${sessionId} for ${tier} tier`);
    
    // In real implementation:
    // 1. Check Stripe payment status
    // 2. Verify session hasn't expired
    // 3. Ensure user hasn't exceeded download limits
    // 4. Return true only if all checks pass
    
    return true; // Allow for demo purposes
  }

  // Metrics and telemetry methods
  static getMetrics() {
    return {
      ...this.metrics,
      watermarkCoverageRate: this.calculateCoverageRate(),
      avgProcessingTimeByTier: Object.fromEntries(this.metrics.tierProcessingTime)
    };
  }

  private static calculateCoverageRate(): number {
    const total = this.metrics.watermarkSuccess + this.metrics.watermarkFailures;
    return total > 0 ? (this.metrics.watermarkSuccess / total) * 100 : 0;
  }

  private static emitMetric(eventName: string, data: any): void {
    // In a real implementation, this would send to your analytics service
    console.log(`[METRIC] ${eventName}:`, data);
    
    // Could integrate with services like:
    // - DataDog, New Relic, or custom analytics
    // - Webhook to dashboard service
    // - File-based logging for analysis
  }

  static resetMetrics(): void {
    this.metrics.watermarkSuccess = 0;
    this.metrics.watermarkFailures = 0;
    this.metrics.ffmpegFallbacks = 0;
    this.metrics.tierProcessingTime.clear();
  }
}

export default WatermarkService;
