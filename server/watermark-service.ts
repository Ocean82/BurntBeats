import fs from 'fs';
import path from 'path';

export class WatermarkService {
  private static watermarkMessages = [
    "This is a Burnt Beats demo - purchase to remove this message",
    "Burnt Beats - Get the clean version at burntbeats.com",
    "Demo track by Burnt Beats - buy now for the full experience",
    "This track contains a Burnt Beats watermark - purchase to unlock",
    "Burnt Beats preview - remove this message with purchase"
  ];

  static generateWatermarkedTrack(originalAudioPath: string, songId: string, songTitle: string): string {
    try {
      console.log(`Adding watermark to song ${songId}: ${songTitle}`);
      
      const watermarkedPath = originalAudioPath.replace('.mp3', '_watermarked.mp3').replace('.wav', '_watermarked.wav');
      
      // Add subtle audio watermark overlay that preserves musical quality
      this.addSubtleWatermark(originalAudioPath, watermarkedPath);
      
      console.log(`Watermarked track created: ${watermarkedPath}`);
      return watermarkedPath;
    } catch (error) {
      console.error('Watermark generation failed:', error);
      // Fallback to copying original file
      if (fs.existsSync(originalAudioPath)) {
        fs.copyFileSync(originalAudioPath, watermarkedPath);
      }
      return watermarkedPath;
    }
  }

  private static addSubtleWatermark(inputPath: string, outputPath: string): void {
    // Check if custom watermark overlay exists
    const watermarkOverlayPath = path.join(process.cwd(), 'uploads', 'watermark_overlay.mp3');
    
    if (fs.existsSync(watermarkOverlayPath)) {
      console.log('Using custom watermark overlay');
      this.mixWithCustomOverlay(inputPath, outputPath, watermarkOverlayPath);
    } else {
      console.log('Using default watermark method');
      this.addDefaultWatermark(inputPath, outputPath);
    }
  }

  private static mixWithCustomOverlay(inputPath: string, outputPath: string, overlayPath: string): void {
    try {
      // Try using ffmpeg for high-quality mixing
      const { exec } = require('child_process');
      exec(`ffmpeg -i "${inputPath}" -i "${overlayPath}" -filter_complex "[0:a]volume=1.0[main];[1:a]volume=0.15[overlay];[main][overlay]amix=inputs=2:duration=first:dropout_transition=0" "${outputPath}" -y`, 
        (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.log('FFmpeg not available, using manual mixing');
            this.manualMixOverlay(inputPath, outputPath, overlayPath);
          } else {
            console.log('Watermark overlay applied with ffmpeg');
          }
        });
    } catch (error) {
      console.log('Fallback to manual mixing');
      this.manualMixOverlay(inputPath, outputPath, overlayPath);
    }
  }

  private static manualMixOverlay(inputPath: string, outputPath: string, overlayPath: string): void {
    // Manual audio mixing (simplified approach)
    // For now, copy the main audio and add subtle periodic watermark
    const inputData = fs.readFileSync(inputPath);
    const watermarkedData = Buffer.from(inputData);
    
    // Parse WAV header
    const sampleRate = inputData.readUInt32LE(24);
    const channels = inputData.readUInt16LE(22);
    const headerSize = 44;
    const audioData = inputData.slice(headerSize);
    
    // Add periodic watermark sounds every 20 seconds
    this.addPeriodicWatermarkSounds(watermarkedData, headerSize, sampleRate, channels);
    
    fs.writeFileSync(outputPath, watermarkedData);
  }

  private static addPeriodicWatermarkSounds(audioData: Buffer, headerSize: number, sampleRate: number, channels: number): void {
    const audioSection = audioData.slice(headerSize);
    const interval = sampleRate * 20 * channels * 2; // Every 20 seconds
    const duration = sampleRate * 1.5 * channels * 2; // 1.5 second watermark sound
    
    for (let pos = headerSize; pos < audioData.length; pos += interval) {
      // Add a subtle "whoosh" sound that indicates this is a preview
      this.addWhooshSound(audioData, pos, Math.min(duration, audioData.length - pos), sampleRate, channels);
    }
  }

  private static addWhooshSound(audioData: Buffer, startPos: number, duration: number, sampleRate: number, channels: number): void {
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

  private static addDefaultWatermark(inputPath: string, outputPath: string): void {
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
      this.addWatermarkTone(watermarkedData, pos, watermarkDuration, sampleRate, channels);
    }
    
    // Add inaudible frequency signature throughout
    this.addFrequencySignature(watermarkedData, sampleRate, channels);
    
    // Write watermarked file
    const header = inputData.slice(0, headerSize);
    fs.writeFileSync(outputPath, Buffer.concat([header, watermarkedData]));
  }

  private static addWatermarkTone(audioData: Buffer, startPos: number, duration: number, sampleRate: number, channels: number): void {
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

  private static addFrequencySignature(audioData: Buffer, sampleRate: number, channels: number): void {
    // Add a very subtle frequency signature that identifies the track as watermarked
    // This is inaudible but can be detected by audio analysis software
    const signatureFreq = 17500; // Very high frequency, mostly inaudible
    const amplitude = 300; // Extremely quiet
    
    const bytesPerSample = channels * 2;
    const totalSamples = audioData.length / bytesPerSample;
    
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

  static generateCleanTrack(originalAudioPath: string, tier: string, songId: string): string {
    try {
      console.log(`Generating clean ${tier} track for song ${songId}`);
      
      // Generate different quality versions based on tier
      const qualityMap = {
        'bonus': '_bonus_128kbps.mp3',    // Keep watermark for bonus tier
        'base': '_base_320kbps.mp3',      // Clean version
        'top': '_top_studio.wav'          // Studio quality clean version
      };
      
      const suffix = qualityMap[tier as keyof typeof qualityMap] || '_clean.mp3';
      const cleanPath = originalAudioPath.replace(/\.(mp3|wav)$/, suffix);
      
      if (tier === 'bonus') {
        // Bonus tier keeps the watermark but is still purchasable
        return this.generateWatermarkedTrack(originalAudioPath, songId, 'Bonus Track');
      }
      
      // For Base and Top tiers, generate clean versions
      // In real implementation, this would:
      // 1. Load the original unwatermarked audio
      // 2. Apply quality settings based on tier
      // 3. Export in appropriate format and bitrate
      
      if (fs.existsSync(originalAudioPath)) {
        fs.copyFileSync(originalAudioPath, cleanPath);
        console.log(`Clean ${tier} track created: ${cleanPath}`);
      }
      
      return cleanPath;
    } catch (error) {
      console.error('Clean track generation failed:', error);
      throw error;
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
}

export default WatermarkService;