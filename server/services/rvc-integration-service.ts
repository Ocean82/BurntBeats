
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

export interface RVCConversionOptions {
  inputAudioPath: string;
  outputAudioPath: string;
  modelPath: string;
  pitchShift?: number;
  indexRate?: number;
  filterRadius?: number;
  rmsThreshold?: number;
  protectVoiceless?: number;
  method?: 'harvest' | 'pm' | 'crepe' | 'rmvpe';
}

export class RVCIntegrationService {
  private static instance: RVCIntegrationService;
  private rvcPath: string;
  private isInitialized = false;

  private constructor() {
    this.rvcPath = path.join(process.cwd(), 'Retrieval-based-Voice-Conversion-WebUI');
  }

  static getInstance(): RVCIntegrationService {
    if (!RVCIntegrationService.instance) {
      RVCIntegrationService.instance = new RVCIntegrationService();
    }
    return RVCIntegrationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if RVC directory exists
      const rvcExists = await fs.access(this.rvcPath).then(() => true).catch(() => false);
      
      if (!rvcExists) {
        logger.warn('RVC not found. Please ensure Retrieval-based-Voice-Conversion-WebUI is installed.');
        return;
      }

      // Check for required models
      const requiredPaths = [
        'assets/hubert/hubert_base.pt',
        'assets/rmvpe/rmvpe.pt'
      ];

      for (const requiredPath of requiredPaths) {
        const fullPath = path.join(this.rvcPath, requiredPath);
        const exists = await fs.access(fullPath).then(() => true).catch(() => false);
        
        if (!exists) {
          logger.warn(`Required RVC model not found: ${requiredPath}`);
        }
      }

      this.isInitialized = true;
      logger.info('RVC Integration Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RVC Integration Service:', error);
      throw error;
    }
  }

  async convertVoice(options: RVCConversionOptions): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      inputAudioPath,
      outputAudioPath,
      modelPath,
      pitchShift = 0,
      indexRate = 0.75,
      filterRadius = 3,
      rmsThreshold = 0.25,
      protectVoiceless = 0.33,
      method = 'rmvpe'
    } = options;

    return new Promise((resolve, reject) => {
      const args = [
        path.join(this.rvcPath, 'tools', 'infer_cli.py'),
        '--input_path', inputAudioPath,
        '--output_path', outputAudioPath,
        '--model_path', modelPath,
        '--transpose', pitchShift.toString(),
        '--index_rate', indexRate.toString(),
        '--filter_radius', filterRadius.toString(),
        '--rms_mix_rate', rmsThreshold.toString(),
        '--protect', protectVoiceless.toString(),
        '--f0method', method
      ];

      const rvcProcess = spawn('python', args, {
        cwd: this.rvcPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      rvcProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      rvcProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rvcProcess.on('close', (code) => {
        if (code === 0) {
          logger.info(`RVC conversion completed: ${outputAudioPath}`);
          resolve(outputAudioPath);
        } else {
          logger.error(`RVC conversion failed with code ${code}: ${stderr}`);
          reject(new Error(`RVC conversion failed: ${stderr}`));
        }
      });

      rvcProcess.on('error', (error) => {
        logger.error('RVC process error:', error);
        reject(error);
      });
    });
  }

  async convertMIDIToVocal(
    midiPath: string,
    voiceModelPath: string,
    lyrics: string,
    options: Partial<RVCConversionOptions> = {}
  ): Promise<string> {
    try {
      // Step 1: Convert MIDI to WAV using existing music generator
      const tempWavPath = path.join(process.cwd(), 'uploads', `temp_${Date.now()}.wav`);
      const finalOutputPath = path.join(process.cwd(), 'uploads', `rvc_vocal_${Date.now()}.wav`);

      // Generate base audio from MIDI
      await this.generateBaseAudioFromMIDI(midiPath, tempWavPath, lyrics);

      // Step 2: Apply RVC voice conversion
      const rvcOptions: RVCConversionOptions = {
        inputAudioPath: tempWavPath,
        outputAudioPath: finalOutputPath,
        modelPath: voiceModelPath,
        ...options
      };

      const result = await this.convertVoice(rvcOptions);

      // Clean up temporary file
      await fs.unlink(tempWavPath).catch(() => {});

      return result;
    } catch (error) {
      logger.error('MIDI to vocal conversion failed:', error);
      throw error;
    }
  }

  private async generateBaseAudioFromMIDI(
    midiPath: string,
    outputPath: string,
    lyrics: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'server/music-generator.py',
        '--title', 'RVC Source Audio',
        '--lyrics', lyrics,
        '--genre', 'pop',
        '--tempo', '120',
        '--key', 'C',
        '--duration', '30',
        '--output_path', outputPath
      ];

      const process = spawn('python', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Base audio generation failed: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async trainVoiceModel(
    trainingDataPath: string,
    modelName: string,
    options: {
      epochs?: number;
      batchSize?: number;
      learningRate?: number;
      sampleRate?: number;
    } = {}
  ): Promise<string> {
    const {
      epochs = 10000,
      batchSize = 7,
      learningRate = 0.0001,
      sampleRate = 40000
    } = options;

    return new Promise((resolve, reject) => {
      const args = [
        path.join(this.rvcPath, 'train.py'),
        '--model_name', modelName,
        '--data_path', trainingDataPath,
        '--epochs', epochs.toString(),
        '--batch_size', batchSize.toString(),
        '--learning_rate', learningRate.toString(),
        '--sample_rate', sampleRate.toString()
      ];

      const trainProcess = spawn('python', args, {
        cwd: this.rvcPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      trainProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        logger.info(`Training progress: ${data.toString().trim()}`);
      });

      trainProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      trainProcess.on('close', (code) => {
        if (code === 0) {
          const modelPath = path.join(this.rvcPath, 'logs', modelName, `${modelName}.pth`);
          logger.info(`Voice model training completed: ${modelPath}`);
          resolve(modelPath);
        } else {
          logger.error(`Voice model training failed: ${stderr}`);
          reject(new Error(`Training failed: ${stderr}`));
        }
      });

      trainProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async listAvailableModels(): Promise<string[]> {
    try {
      const logsPath = path.join(this.rvcPath, 'logs');
      const exists = await fs.access(logsPath).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }

      const dirs = await fs.readdir(logsPath, { withFileTypes: true });
      const models = [];

      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const modelPath = path.join(logsPath, dir.name, `${dir.name}.pth`);
          const modelExists = await fs.access(modelPath).then(() => true).catch(() => false);
          
          if (modelExists) {
            models.push(modelPath);
          }
        }
      }

      return models;
    } catch (error) {
      logger.error('Failed to list available models:', error);
      return [];
    }
  }
}

export default RVCIntegrationService;
