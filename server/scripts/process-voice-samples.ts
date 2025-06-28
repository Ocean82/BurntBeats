
import fs from 'fs';
import path from 'path';
import { VoiceCloningService } from '../services/voice-cloning-service';
import { voiceBankService } from '../services/voice-bank-service';
import { Logger } from '../utils/logger';

const logger = new Logger({ name: 'VoiceSampleProcessor' });

interface AudioFile {
  filename: string;
  path: string;
  size: number;
  format: string;
}

export class VoiceSampleProcessor {
  private voiceCloningService: VoiceCloningService;
  private attachedAssetsDir: string;

  constructor() {
    this.voiceCloningService = VoiceCloningService.getInstance();
    this.attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
  }

  async processAllVoiceSamples(): Promise<void> {
    try {
      logger.info('Starting voice sample processing...');

      // Get all audio files from attached_assets
      const audioFiles = this.getAudioFiles();
      logger.info(`Found ${audioFiles.length} audio files to process`);

      for (const audioFile of audioFiles) {
        try {
          await this.processVoiceFile(audioFile);
        } catch (error) {
          logger.error(`Failed to process ${audioFile.filename}:`, error);
          continue; // Continue with next file
        }
      }

      logger.info('Voice sample processing completed');
    } catch (error) {
      logger.error('Voice sample processing failed:', error);
      throw error;
    }
  }

  private getAudioFiles(): AudioFile[] {
    const audioFiles: AudioFile[] = [];
    
    // Audio file extensions we support
    const supportedFormats = ['.mp3', '.wav', '.flac', '.ogg'];
    
    try {
      const files = fs.readdirSync(this.attachedAssetsDir);
      
      for (const filename of files) {
        const filePath = path.join(this.attachedAssetsDir, filename);
        const ext = path.extname(filename).toLowerCase();
        
        // Skip non-audio files and Audacity project files
        if (!supportedFormats.includes(ext) || filename.includes('.aup3')) {
          continue;
        }
        
        try {
          const stats = fs.statSync(filePath);
          audioFiles.push({
            filename,
            path: filePath,
            size: stats.size,
            format: ext.slice(1)
          });
        } catch (error) {
          logger.warn(`Could not read file stats for ${filename}:`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to read attached_assets directory:', error);
    }

    return audioFiles;
  }

  private async processVoiceFile(audioFile: AudioFile): Promise<void> {
    try {
      logger.info(`Processing voice file: ${audioFile.filename}`);

      // Read the audio file
      const audioBuffer = fs.readFileSync(audioFile.path);
      
      // Generate a clean name for the voice clone
      const voiceName = this.generateVoiceName(audioFile.filename);
      
      // Clone the voice and generate national anthem sample
      const voiceClone = await this.voiceCloningService.cloneVoice(audioBuffer, {
        userId: 'system',
        name: voiceName,
        makePublic: true,
        sampleText: this.getNationalAnthemText()
      });

      // Also add to voice bank service for additional processing
      const voiceProfile = await voiceBankService.addVoiceProfile(
        audioBuffer,
        audioFile.filename,
        {
          gender: this.detectGender(audioFile.filename),
          language: 'en',
          accent: 'neutral',
          source: 'burnt_beats_collection'
        }
      );

      // Generate additional vocal sample with the voice
      const vocalSample = await voiceBankService.generateVocalSample(
        voiceProfile.id,
        this.getNationalAnthemText(),
        undefined,
        15 // 15 second duration
      );

      logger.info(`Successfully processed ${audioFile.filename}`, {
        voiceCloneId: voiceClone.id,
        voiceProfileId: voiceProfile.id,
        anthemUrl: voiceClone.anthemUrl,
        sampleGenerated: vocalSample !== null
      });

    } catch (error) {
      logger.error(`Failed to process voice file ${audioFile.filename}:`, error);
      throw error;
    }
  }

  private generateVoiceName(filename: string): string {
    // Clean up filename to create a readable voice name
    const baseName = path.basename(filename, path.extname(filename));
    
    // Remove timestamps and clean up
    const cleanName = baseName
      .replace(/_\d+/g, '') // Remove timestamps
      .replace(/audio\s*sample\s*/gi, '') // Remove "audio sample"
      .replace(/audion\s*sample\s*/gi, '') // Remove "audion sample" (typo)
      .replace(/\s*for\s*bb\s*/gi, '') // Remove "for BB"
      .replace(/\s*vm\s*/gi, '') // Remove "VM"
      .replace(/bb\d*/gi, 'Burnt Beats Voice') // Replace BB with readable name
      .replace(/[-_]+/g, ' ') // Replace dashes/underscores with spaces
      .trim();

    // If name is empty or too short, generate a default name
    if (cleanName.length < 3) {
      return `Burnt Beats Voice ${Date.now()}`;
    }

    // Capitalize words
    return cleanName.replace(/\b\w/g, l => l.toUpperCase());
  }

  private detectGender(filename: string): 'male' | 'female' | 'neutral' {
    const lowerFilename = filename.toLowerCase();
    
    // Simple heuristics - in production you'd use audio analysis
    if (lowerFilename.includes('male') || lowerFilename.includes('man')) {
      return 'male';
    } else if (lowerFilename.includes('female') || lowerFilename.includes('woman')) {
      return 'female';
    }
    
    // Default to neutral if we can't determine
    return 'neutral';
  }

  private getNationalAnthemText(): string {
    return `Oh say can you see, by the dawn's early light,
What so proudly we hailed at the twilight's last gleaming,
Whose broad stripes and bright stars through the perilous fight,
O'er the ramparts we watched, were so gallantly streaming.
And the rocket's red glare, the bombs bursting in air,
Gave proof through the night that our flag was still there.
Oh say does that star-spangled banner yet wave,
O'er the land of the free and the home of the brave.`;
  }

  // Method to process a single file by name
  async processSingleFile(filename: string): Promise<void> {
    const filePath = path.join(this.attachedAssetsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }

    const stats = fs.statSync(filePath);
    const audioFile: AudioFile = {
      filename,
      path: filePath,
      size: stats.size,
      format: path.extname(filename).slice(1)
    };

    await this.processVoiceFile(audioFile);
  }

  // Get processing status
  async getProcessingStatus(): Promise<{
    totalFiles: number;
    processedFiles: number;
    availableVoices: number;
  }> {
    const audioFiles = this.getAudioFiles();
    const availableVoices = await this.voiceCloningService.getAvailableVoices();
    
    return {
      totalFiles: audioFiles.length,
      processedFiles: availableVoices.length,
      availableVoices: availableVoices.length
    };
  }
}

// Export singleton instance
export const voiceSampleProcessor = new VoiceSampleProcessor();
