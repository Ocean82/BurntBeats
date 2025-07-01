
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Logger } from '../utils/logger';

const execAsync = promisify(exec);
const logger = new Logger({ name: 'VoiceCloningContainer' });

export interface VoiceModel {
  id: string;
  name: string;
  type: 'rvc' | 'bark';
  modelPath: string;
  embeddingPath?: string;
  characteristics: {
    pitch: number;
    timbre: string;
    quality: number;
    language: string;
  };
}

export interface VoiceCloneRequest {
  text: string;
  voiceModelId: string;
  style?: {
    emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
    speed: number; // 0.5 to 2.0
    pitch: number; // -12 to +12 semitones
  };
  outputFormat: 'wav' | 'mp3';
}

export interface VoiceCloneResponse {
  audioPath: string;
  audioUrl: string;
  duration: number;
  quality: number;
  processingTime: number;
}

export class VoiceCloningContainer {
  private static instance: VoiceCloningContainer;
  private models: Map<string, VoiceModel> = new Map();
  private tempDir: string;
  private outputDir: string;
  private rvcScriptPath: string;
  private barkScriptPath: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'storage', 'temp');
    this.outputDir = path.join(process.cwd(), 'storage', 'voice-outputs');
    this.rvcScriptPath = path.join(process.cwd(), 'Retrieval-based-Voice-Conversion-WebUI', 'api_231006.py');
    this.barkScriptPath = path.join(process.cwd(), 'server', 'scripts', 'bark-synthesizer.py');
    this.initializeDirectories();
  }

  public static getInstance(): VoiceCloningContainer {
    if (!VoiceCloningContainer.instance) {
      VoiceCloningContainer.instance = new VoiceCloningContainer();
    }
    return VoiceCloningContainer.instance;
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(process.cwd(), 'storage', 'voice-models'), { recursive: true });
      logger.info('Voice cloning directories initialized');
    } catch (error) {
      logger.error('Failed to initialize directories', { error: error.message });
    }
  }

  /**
   * Register a new voice model from audio sample
   */
  async registerVoiceModel(
    audioBuffer: Buffer,
    name: string,
    type: 'rvc' | 'bark' = 'rvc'
  ): Promise<VoiceModel> {
    const modelId = crypto.randomUUID();
    const audioPath = path.join(this.tempDir, `${modelId}.wav`);
    
    try {
      // Save audio sample
      await fs.writeFile(audioPath, audioBuffer);
      
      // Process based on type
      let modelPath: string;
      let embeddingPath: string | undefined;
      
      if (type === 'rvc') {
        const result = await this.processRVCModel(audioPath, modelId);
        modelPath = result.modelPath;
        embeddingPath = result.embeddingPath;
      } else {
        modelPath = await this.processBarkModel(audioPath, modelId);
      }

      // Analyze voice characteristics
      const characteristics = await this.analyzeVoiceCharacteristics(audioPath);
      
      const voiceModel: VoiceModel = {
        id: modelId,
        name,
        type,
        modelPath,
        embeddingPath,
        characteristics
      };

      this.models.set(modelId, voiceModel);
      logger.info('Voice model registered', { modelId, name, type });
      
      return voiceModel;
    } catch (error) {
      logger.error('Failed to register voice model', { error: error.message, modelId });
      throw new Error(`Voice model registration failed: ${error.message}`);
    }
  }

  /**
   * Clone voice with text input
   */
  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const startTime = Date.now();
    const voiceModel = this.models.get(request.voiceModelId);
    
    if (!voiceModel) {
      throw new Error(`Voice model not found: ${request.voiceModelId}`);
    }

    try {
      logger.info('Starting voice cloning', { 
        voiceModelId: request.voiceModelId, 
        textLength: request.text.length,
        type: voiceModel.type 
      });

      let audioPath: string;
      
      if (voiceModel.type === 'rvc') {
        audioPath = await this.synthesizeWithRVC(request, voiceModel);
      } else {
        audioPath = await this.synthesizeWithBark(request, voiceModel);
      }

      // Get audio duration
      const duration = await this.getAudioDuration(audioPath);
      const processingTime = Date.now() - startTime;

      const response: VoiceCloneResponse = {
        audioPath,
        audioUrl: `/api/voice/outputs/${path.basename(audioPath)}`,
        duration,
        quality: this.calculateQuality(voiceModel, request),
        processingTime
      };

      logger.info('Voice cloning completed', { 
        voiceModelId: request.voiceModelId,
        processingTime,
        duration 
      });

      return response;
    } catch (error) {
      logger.error('Voice cloning failed', { 
        error: error.message, 
        voiceModelId: request.voiceModelId 
      });
      throw new Error(`Voice cloning failed: ${error.message}`);
    }
  }

  /**
   * Process RVC model creation
   */
  private async processRVCModel(audioPath: string, modelId: string): Promise<{
    modelPath: string;
    embeddingPath: string;
  }> {
    const modelPath = path.join(process.cwd(), 'storage', 'voice-models', `${modelId}.pth`);
    const embeddingPath = path.join(process.cwd(), 'storage', 'voice-models', `${modelId}_embedding.npy`);
    
    try {
      // Use RVC training script to create model
      const command = `python "${this.rvcScriptPath}" --mode=train --input="${audioPath}" --output="${modelPath}" --embedding="${embeddingPath}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000, // 2 minutes timeout
        cwd: path.dirname(this.rvcScriptPath)
      });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`RVC processing error: ${stderr}`);
      }

      logger.info('RVC model processed', { modelId, stdout });
      
      return { modelPath, embeddingPath };
    } catch (error) {
      logger.error('RVC model processing failed', { error: error.message, modelId });
      throw error;
    }
  }

  /**
   * Process Bark model creation
   */
  private async processBarkModel(audioPath: string, modelId: string): Promise<string> {
    const modelPath = path.join(process.cwd(), 'storage', 'voice-models', `${modelId}_bark.json`);
    
    try {
      // Create Bark voice profile
      const command = `python "${this.barkScriptPath}" --mode=create --input="${audioPath}" --output="${modelPath}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 1 minute timeout
      });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`Bark processing error: ${stderr}`);
      }

      logger.info('Bark model processed', { modelId, stdout });
      
      return modelPath;
    } catch (error) {
      logger.error('Bark model processing failed', { error: error.message, modelId });
      throw error;
    }
  }

  /**
   * Synthesize with RVC
   */
  private async synthesizeWithRVC(
    request: VoiceCloneRequest, 
    voiceModel: VoiceModel
  ): Promise<string> {
    const outputPath = path.join(
      this.outputDir, 
      `rvc_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${request.outputFormat}`
    );

    try {
      const command = [
        `python "${this.rvcScriptPath}"`,
        `--mode=infer`,
        `--text="${request.text.replace(/"/g, '\\"')}"`,
        `--model="${voiceModel.modelPath}"`,
        `--embedding="${voiceModel.embeddingPath}"`,
        `--output="${outputPath}"`,
        `--pitch=${request.style?.pitch || 0}`,
        `--speed=${request.style?.speed || 1.0}`,
        `--emotion=${request.style?.emotion || 'neutral'}`
      ].join(' ');

      const { stdout, stderr } = await execAsync(command, {
        timeout: 180000, // 3 minutes timeout
        cwd: path.dirname(this.rvcScriptPath)
      });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`RVC synthesis error: ${stderr}`);
      }

      // Verify output file exists
      await fs.access(outputPath);
      
      return outputPath;
    } catch (error) {
      logger.error('RVC synthesis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Synthesize with Bark
   */
  private async synthesizeWithBark(
    request: VoiceCloneRequest, 
    voiceModel: VoiceModel
  ): Promise<string> {
    const outputPath = path.join(
      this.outputDir, 
      `bark_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${request.outputFormat}`
    );

    try {
      const command = [
        `python "${this.barkScriptPath}"`,
        `--mode=synthesize`,
        `--text="${request.text.replace(/"/g, '\\"')}"`,
        `--voice="${voiceModel.modelPath}"`,
        `--output="${outputPath}"`,
        `--speed=${request.style?.speed || 1.0}`,
        `--emotion=${request.style?.emotion || 'neutral'}`
      ].join(' ');

      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000, // 2 minutes timeout
      });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`Bark synthesis error: ${stderr}`);
      }

      // Verify output file exists
      await fs.access(outputPath);
      
      return outputPath;
    } catch (error) {
      logger.error('Bark synthesis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze voice characteristics
   */
  private async analyzeVoiceCharacteristics(audioPath: string): Promise<VoiceModel['characteristics']> {
    try {
      // Use librosa or similar for analysis
      const analysisScript = path.join(process.cwd(), 'server', 'scripts', 'voice-analyzer.py');
      const command = `python "${analysisScript}" --input="${audioPath}"`;
      
      const { stdout } = await execAsync(command, { timeout: 30000 });
      const analysis = JSON.parse(stdout);
      
      return {
        pitch: analysis.fundamental_frequency || 200,
        timbre: analysis.timbre_classification || 'warm',
        quality: analysis.clarity_score || 0.85,
        language: analysis.detected_language || 'en'
      };
    } catch (error) {
      logger.warn('Voice analysis failed, using defaults', { error: error.message });
      
      // Return default characteristics
      return {
        pitch: 200,
        timbre: 'neutral',
        quality: 0.8,
        language: 'en'
      };
    }
  }

  /**
   * Get audio duration in seconds
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const command = `python -c "import librosa; y, sr = librosa.load('${audioPath}'); print(len(y) / sr)"`;
      const { stdout } = await execAsync(command, { timeout: 10000 });
      return parseFloat(stdout.trim());
    } catch (error) {
      logger.warn('Could not get audio duration', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate quality score
   */
  private calculateQuality(voiceModel: VoiceModel, request: VoiceCloneRequest): number {
    let quality = voiceModel.characteristics.quality;
    
    // Adjust for style modifications
    if (request.style) {
      if (Math.abs(request.style.pitch) > 6) quality *= 0.9;
      if (request.style.speed < 0.8 || request.style.speed > 1.5) quality *= 0.95;
    }
    
    return Math.max(0.1, Math.min(1.0, quality));
  }

  /**
   * Get available voice models
   */
  getAvailableModels(): VoiceModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Delete voice model
   */
  async deleteVoiceModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Voice model not found: ${modelId}`);
    }

    try {
      // Delete model files
      await fs.unlink(model.modelPath).catch(() => {});
      if (model.embeddingPath) {
        await fs.unlink(model.embeddingPath).catch(() => {});
      }

      this.models.delete(modelId);
      logger.info('Voice model deleted', { modelId });
    } catch (error) {
      logger.error('Failed to delete voice model', { error: error.message, modelId });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    models: number;
    rvcAvailable: boolean;
    barkAvailable: boolean;
  }> {
    let rvcAvailable = false;
    let barkAvailable = false;

    try {
      await fs.access(this.rvcScriptPath);
      rvcAvailable = true;
    } catch (error) {
      logger.warn('RVC not available', { path: this.rvcScriptPath });
    }

    try {
      await fs.access(this.barkScriptPath);
      barkAvailable = true;
    } catch (error) {
      logger.warn('Bark not available', { path: this.barkScriptPath });
    }

    const status = (rvcAvailable || barkAvailable) ? 'healthy' : 'unhealthy';
    
    return {
      status,
      models: this.models.size,
      rvcAvailable,
      barkAvailable
    };
  }
}
