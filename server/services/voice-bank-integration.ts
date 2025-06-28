import fs from 'fs';
import path from 'path';
import { Logger } from '../logger';

export interface VoiceProfile {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  duration: number;
  format: string;
  isDefault: boolean;
  createdAt: Date;
  metadata?: {
    pitch?: number;
    gender?: 'male' | 'female' | 'neutral';
    language?: string;
  };
}

export class VoiceBankIntegration {
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private defaultVoiceId: string | null = null;
  private voiceBankPath: string;

  constructor() {
    this.voiceBankPath = path.join(process.cwd(), 'storage', 'voice-bank');
    this.ensureDirectories();
    this.loadDefaultVoice();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.voiceBankPath)) {
      fs.mkdirSync(this.voiceBankPath, { recursive: true });
      Logger.info('Voice bank storage directory created');
    }
  }

  private loadDefaultVoice(): void {
    const defaultVoicePath = path.join(process.cwd(), 'attached_assets', 'Default Project_1750771377076.mp3');
    
    if (fs.existsSync(defaultVoicePath)) {
      try {
        const stats = fs.statSync(defaultVoicePath);
        const bankFilePath = path.join(this.voiceBankPath, 'default-voice.mp3');
        
        // Copy to voice bank storage
        fs.copyFileSync(defaultVoicePath, bankFilePath);
        
        const voiceProfile: VoiceProfile = {
          id: 'default-voice',
          name: 'Default Voice',
          filePath: bankFilePath,
          fileSize: stats.size,
          duration: 180, // Estimated 3 minutes
          format: 'mp3',
          isDefault: true,
          createdAt: new Date(),
          metadata: {
            gender: 'neutral',
            language: 'en',
            pitch: 220
          }
        };

        this.voiceProfiles.set(voiceProfile.id, voiceProfile);
        this.defaultVoiceId = voiceProfile.id;

        Logger.info('Default voice loaded successfully', { 
          id: voiceProfile.id, 
          size: voiceProfile.fileSize 
        });
      } catch (error) {
        Logger.error('Failed to load default voice', error);
      }
    } else {
      Logger.warn('Default voice file not found at expected location');
    }
  }

  public getDefaultVoice(): VoiceProfile | undefined {
    return this.defaultVoiceId ? this.voiceProfiles.get(this.defaultVoiceId) : undefined;
  }

  public getAllVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.voiceProfiles.values());
  }

  public getVoiceProfile(voiceId: string): VoiceProfile | undefined {
    return this.voiceProfiles.get(voiceId);
  }

  public async addVoiceProfile(audioBuffer: Buffer, filename: string): Promise<VoiceProfile> {
    const voiceId = `voice-${Date.now()}`;
    const fileExtension = path.extname(filename);
    const filePath = path.join(this.voiceBankPath, `${voiceId}${fileExtension}`);

    fs.writeFileSync(filePath, audioBuffer);
    const stats = fs.statSync(filePath);

    const voiceProfile: VoiceProfile = {
      id: voiceId,
      name: path.basename(filename, fileExtension),
      filePath,
      fileSize: stats.size,
      duration: 120, // Estimated duration
      format: fileExtension.slice(1),
      isDefault: false,
      createdAt: new Date()
    };

    this.voiceProfiles.set(voiceId, voiceProfile);
    Logger.info('Voice profile added', { id: voiceId, name: voiceProfile.name });

    return voiceProfile;
  }

  public async generateVocalSample(voiceId: string, text: string): Promise<Buffer | null> {
    const voiceProfile = this.voiceProfiles.get(voiceId);
    if (!voiceProfile) {
      Logger.error('Voice profile not found', { voiceId });
      return null;
    }

    try {
      // Return the voice file as sample output
      // In production, this would process the text with the voice characteristics
      const audioBuffer = fs.readFileSync(voiceProfile.filePath);
      
      Logger.info('Vocal sample generated', { 
        voiceId, 
        textLength: text.length,
        outputSize: audioBuffer.length 
      });

      return audioBuffer;
    } catch (error) {
      Logger.error('Failed to generate vocal sample', { voiceId, error });
      return null;
    }
  }

  public getVoiceBankStats(): {
    totalVoices: number;
    defaultVoiceAvailable: boolean;
    totalStorageUsed: number;
  } {
    const totalStorageUsed = Array.from(this.voiceProfiles.values())
      .reduce((total, profile) => total + profile.fileSize, 0);

    return {
      totalVoices: this.voiceProfiles.size,
      defaultVoiceAvailable: this.defaultVoiceId !== null,
      totalStorageUsed
    };
  }

  public isDefaultVoiceAvailable(): boolean {
    return this.defaultVoiceId !== null && this.voiceProfiles.has(this.defaultVoiceId);
  }

  public getVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.voiceProfiles.values());
  }

  public canGenerateVocals(): boolean {
    return this.isDefaultVoiceAvailable();
  }
}

// Export singleton instance
export const voiceBankIntegration = new VoiceBankIntegration();