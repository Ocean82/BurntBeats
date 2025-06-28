import fs from 'fs';
import path from 'path';
import { Logger } from '../logger';

export interface VoiceProfile {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  duration: number;
  sampleRate: number;
  format: string;
  isDefault: boolean;
  createdAt: Date;
  metadata?: {
    pitch?: number;
    timbre?: string;
    gender?: 'male' | 'female' | 'neutral';
    language?: string;
    accent?: string;
  };
}

export interface VoiceAnalysis {
  pitch: {
    fundamental: number;
    range: { min: number; max: number };
    stability: number;
  };
  timbre: {
    brightness: number;
    warmth: number;
    roughness: number;
  };
  dynamics: {
    averageLevel: number;
    dynamicRange: number;
  };
  spectral: {
    centroid: number;
    rolloff: number;
    flux: number;
  };
}

export class VoiceBankService {
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private defaultVoiceId: string | null = null;
  private voiceBankPath: string;

  constructor() {
    this.voiceBankPath = path.join(process.cwd(), 'storage', 'voice-bank');
    this.ensureVoiceBankDirectory();
    this.initializeVoiceBank();
  }

  private ensureVoiceBankDirectory(): void {
    if (!fs.existsSync(this.voiceBankPath)) {
      fs.mkdirSync(this.voiceBankPath, { recursive: true });
      Logger.info('Voice bank directory created');
    }
  }

  private async initializeVoiceBank(): Promise<void> {
    try {
      // Load default voice from attached assets
      await this.loadDefaultVoice();
      
      // Load any additional voice profiles from voice bank directory
      await this.loadExistingVoices();
      
      Logger.info(`Voice bank initialized with ${this.voiceProfiles.size} voice profiles`);
    } catch (error) {
      Logger.error('Failed to initialize voice bank', error);
    }
  }

  private async loadDefaultVoice(): Promise<void> {
    const defaultVoicePath = path.join(process.cwd(), 'attached_assets', 'Default Project_1750771377076.mp3');
    
    if (fs.existsSync(defaultVoicePath)) {
      try {
        const stats = fs.statSync(defaultVoicePath);
        const voiceProfile: VoiceProfile = {
          id: 'default-voice-01',
          name: 'Default Voice',
          filePath: defaultVoicePath,
          fileSize: stats.size,
          duration: 0, // Will be calculated during analysis
          sampleRate: 44100, // Default, will be updated during analysis
          format: 'mp3',
          isDefault: true,
          createdAt: new Date(),
          metadata: {
            gender: 'neutral',
            language: 'en',
            accent: 'neutral'
          }
        };

        // Copy to voice bank for processing
        const bankFilePath = path.join(this.voiceBankPath, 'default-voice.mp3');
        fs.copyFileSync(defaultVoicePath, bankFilePath);
        voiceProfile.filePath = bankFilePath;

        this.voiceProfiles.set(voiceProfile.id, voiceProfile);
        this.defaultVoiceId = voiceProfile.id;

        logger.info('Default voice loaded successfully', { 
          id: voiceProfile.id, 
          size: voiceProfile.fileSize 
        });
      } catch (error) {
        logger.error('Failed to load default voice', error);
      }
    } else {
      logger.warn('Default voice file not found, voice bank will operate without default voice');
    }
  }

  private async loadExistingVoices(): Promise<void> {
    try {
      const voiceFiles = fs.readdirSync(this.voiceBankPath)
        .filter(file => file.endsWith('.mp3') || file.endsWith('.wav'))
        .filter(file => !file.startsWith('default-voice')); // Skip default voice, already loaded

      for (const file of voiceFiles) {
        const filePath = path.join(this.voiceBankPath, file);
        const stats = fs.statSync(filePath);
        const voiceId = path.basename(file, path.extname(file));

        const voiceProfile: VoiceProfile = {
          id: voiceId,
          name: voiceId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          filePath,
          fileSize: stats.size,
          duration: 0,
          sampleRate: 44100,
          format: path.extname(file).slice(1),
          isDefault: false,
          createdAt: stats.birthtime || new Date()
        };

        this.voiceProfiles.set(voiceId, voiceProfile);
      }
    } catch (error) {
      logger.error('Failed to load existing voices', error);
    }
  }

  public async addVoiceProfile(
    audioBuffer: Buffer, 
    filename: string, 
    metadata?: Partial<VoiceProfile['metadata']>
  ): Promise<VoiceProfile> {
    const voiceId = `voice-${Date.now()}`;
    const fileExtension = path.extname(filename);
    const filePath = path.join(this.voiceBankPath, `${voiceId}${fileExtension}`);

    // Save audio file
    fs.writeFileSync(filePath, audioBuffer);
    const stats = fs.statSync(filePath);

    const voiceProfile: VoiceProfile = {
      id: voiceId,
      name: path.basename(filename, fileExtension),
      filePath,
      fileSize: stats.size,
      duration: 0, // Will be calculated during analysis
      sampleRate: 44100,
      format: fileExtension.slice(1),
      isDefault: false,
      createdAt: new Date(),
      metadata
    };

    this.voiceProfiles.set(voiceId, voiceProfile);

    logger.info('Voice profile added to bank', { 
      id: voiceId, 
      name: voiceProfile.name,
      size: voiceProfile.fileSize 
    });

    return voiceProfile;
  }

  public getVoiceProfile(voiceId: string): VoiceProfile | undefined {
    return this.voiceProfiles.get(voiceId);
  }

  public getDefaultVoice(): VoiceProfile | undefined {
    return this.defaultVoiceId ? this.voiceProfiles.get(this.defaultVoiceId) : undefined;
  }

  public getAllVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.voiceProfiles.values());
  }

  public async analyzeVoice(voiceId: string): Promise<VoiceAnalysis | null> {
    const voiceProfile = this.voiceProfiles.get(voiceId);
    if (!voiceProfile) {
      return null;
    }

    try {
      // Simplified voice analysis - in production, this would use audio processing libraries
      const analysis: VoiceAnalysis = {
        pitch: {
          fundamental: 220 + Math.random() * 100, // Simulated fundamental frequency
          range: { min: 80, max: 400 },
          stability: 0.7 + Math.random() * 0.3
        },
        timbre: {
          brightness: 0.5 + Math.random() * 0.5,
          warmth: 0.4 + Math.random() * 0.4,
          roughness: Math.random() * 0.3
        },
        dynamics: {
          averageLevel: -12 + Math.random() * 6,
          dynamicRange: 20 + Math.random() * 15
        },
        spectral: {
          centroid: 1500 + Math.random() * 1000,
          rolloff: 4000 + Math.random() * 2000,
          flux: Math.random() * 0.5
        }
      };

      logger.info('Voice analysis completed', { voiceId, analysis });
      return analysis;
    } catch (error) {
      logger.error('Voice analysis failed', { voiceId, error });
      return null;
    }
  }

  public async generateVocalSample(
    voiceId: string, 
    text: string, 
    melody?: number[], 
    duration?: number
  ): Promise<Buffer | null> {
    const voiceProfile = this.voiceProfiles.get(voiceId);
    if (!voiceProfile) {
      logger.error('Voice profile not found', { voiceId });
      return null;
    }

    try {
      // In a real implementation, this would:
      // 1. Load the voice sample
      // 2. Extract voice characteristics
      // 3. Apply text-to-speech with voice cloning
      // 4. Apply melody if provided
      // 5. Generate audio buffer

      logger.info('Generating vocal sample', { 
        voiceId, 
        text: text.substring(0, 50), 
        duration 
      });

      // For now, return the original voice file as a placeholder
      // This maintains the interface while allowing for future implementation
      const originalAudio = fs.readFileSync(voiceProfile.filePath);
      
      logger.info('Vocal sample generated successfully', { 
        voiceId, 
        outputSize: originalAudio.length 
      });

      return originalAudio;
    } catch (error) {
      logger.error('Failed to generate vocal sample', { voiceId, error });
      return null;
    }
  }

  public async removeVoiceProfile(voiceId: string): Promise<boolean> {
    const voiceProfile = this.voiceProfiles.get(voiceId);
    if (!voiceProfile) {
      return false;
    }

    if (voiceProfile.isDefault) {
      logger.warn('Cannot remove default voice profile', { voiceId });
      return false;
    }

    try {
      // Remove file
      if (fs.existsSync(voiceProfile.filePath)) {
        fs.unlinkSync(voiceProfile.filePath);
      }

      // Remove from memory
      this.voiceProfiles.delete(voiceId);

      logger.info('Voice profile removed', { voiceId });
      return true;
    } catch (error) {
      logger.error('Failed to remove voice profile', { voiceId, error });
      return false;
    }
  }

  public getVoiceBankStats(): {
    totalVoices: number;
    defaultVoiceAvailable: boolean;
    totalStorageUsed: number;
    supportedFormats: string[];
  } {
    const totalStorageUsed = Array.from(this.voiceProfiles.values())
      .reduce((total, profile) => total + profile.fileSize, 0);

    return {
      totalVoices: this.voiceProfiles.size,
      defaultVoiceAvailable: this.defaultVoiceId !== null,
      totalStorageUsed,
      supportedFormats: ['mp3', 'wav', 'flac', 'ogg']
    };
  }
}

// Singleton instance
export const voiceBankService = new VoiceBankService();