
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

  async processMIDIFile(midiFilePath: string): Promise<{
    title: string;
    duration: number;
    tempo: number;
    key: string;
    trackCount: number;
  }> {
    try {
      return new Promise((resolve, reject) => {
        const args = [
          'server/midi-analyzer.py',
          '--midi_path', midiFilePath,
          '--analyze_only'
        ];

        const process = spawn('python', args, {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          if (code === 0) {
            try {
              const analysis = JSON.parse(stdout);
              resolve(analysis);
            } catch (e) {
              reject(new Error(`Failed to parse MIDI analysis: ${e}`));
            }
          } else {
            reject(new Error(`MIDI analysis failed: ${stderr}`));
          }
        });

        process.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      logger.error('MIDI file processing failed:', error);
      throw error;
    }
  }

  async generateCompleteTrack(
    musicParams: {
      title: string;
      lyrics: string;
      genre: string;
      tempo: number;
      key: string;
      duration: number;
    },
    voiceModelPath: string,
    options: Partial<RVCConversionOptions> = {}
  ): Promise<string> {
    try {
      // Step 1: Generate instrumental track
      const instrumentalPath = path.join(process.cwd(), 'uploads', `instrumental_${Date.now()}.wav`);
      await this.generateInstrumentalTrack(musicParams, instrumentalPath);

      // Step 2: Generate vocal track with RVC
      const vocalPath = path.join(process.cwd(), 'uploads', `vocal_${Date.now()}.wav`);
      await this.generateVocalTrack(musicParams.lyrics, voiceModelPath, vocalPath, options);

      // Step 3: Mix instrumental and vocal tracks
      const finalMixPath = path.join(process.cwd(), 'uploads', `complete_track_${Date.now()}.wav`);
      await this.mixTracks(instrumentalPath, vocalPath, finalMixPath);

      // Clean up temporary files
      await fs.unlink(instrumentalPath).catch(() => {});
      await fs.unlink(vocalPath).catch(() => {});

      return finalMixPath;
    } catch (error) {
      logger.error('Complete track generation failed:', error);
      throw error;
    }
  }

  private async generateInstrumentalTrack(
    musicParams: {
      title: string;
      genre: string;
      tempo: number;
      key: string;
      duration: number;
    },
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'server/music-generator.py',
        '--title', musicParams.title,
        '--genre', musicParams.genre,
        '--tempo', musicParams.tempo.toString(),
        '--key', musicParams.key,
        '--duration', musicParams.duration.toString(),
        '--output_path', outputPath,
        '--instrumental_only'
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
          reject(new Error(`Instrumental generation failed: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async generateVocalTrack(
    lyrics: string,
    voiceModelPath: string,
    outputPath: string,
    options: Partial<RVCConversionOptions> = {}
  ): Promise<void> {
    // Generate base vocal audio using TTS or simple vocal synthesis
    const baseTTSPath = path.join(process.cwd(), 'uploads', `base_tts_${Date.now()}.wav`);
    
    // Use RVC pipeline for vocal generation
    await this.generateBaseTTSVocal(lyrics, baseTTSPath);
    
    // Apply RVC voice conversion
    const rvcOptions: RVCConversionOptions = {
      inputAudioPath: baseTTSPath,
      outputAudioPath: outputPath,
      modelPath: voiceModelPath,
      ...options
    };

    await this.convertVoice(rvcOptions);
    
    // Clean up base TTS file
    await fs.unlink(baseTTSPath).catch(() => {});
  }

  private async generateBaseTTSVocal(lyrics: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'server/text-to-speech-service.py',
        '--text', lyrics,
        '--output_path', outputPath,
        '--voice', 'neutral'
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
          reject(new Error(`TTS generation failed: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async mixTracks(
    instrumentalPath: string,
    vocalPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'ffmpeg',
        '-i', instrumentalPath,
        '-i', vocalPath,
        '-filter_complex', '[0:0][1:0]amix=inputs=2:duration=longest',
        '-y', outputPath
      ];

      const process = spawn('ffmpeg', args, {
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
          reject(new Error(`Track mixing failed: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
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

  async listAvailableMIDIFiles(): Promise<Array<{ name: string; path: string; title: string }>> {
    try {
      const midiPath = path.join(process.cwd(), 'attached_assets');
      const exists = await fs.access(midiPath).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }

      const files = await fs.readdir(midiPath);
      const midiFiles = [];

      for (const file of files) {
        if (file.endsWith('.mid') || file.endsWith('.midi')) {
          const fullPath = path.join(midiPath, file);
          const title = this.extractTitleFromFilename(file);
          
          midiFiles.push({
            name: file,
            path: fullPath,
            title: title
          });
        }
      }

      return midiFiles;
    } catch (error) {
      logger.error('Failed to list MIDI files:', error);
      return [];
    }
  }

  private extractTitleFromFilename(filename: string): string {
    // Remove timestamp suffix and extension
    let title = filename.replace(/(_\d+)?\.(mid|midi)$/i, '');
    
    // Convert camelCase and handle special cases
    const titleMap: { [key: string]: string } = {
      'EnterSandman': 'Enter Sandman',
      'FeelGoodInc': 'Feel Good Inc',
      'Friends': 'Friends',
      'Gladiator': 'Gladiator Theme',
      'Godfather': 'The Godfather Theme',
      'Hallelujah': 'Hallelujah',
      'InDaClub': 'In Da Club',
      'IronMan': 'Iron Man',
      'Someonelikeyouwitlyric': 'Someone Like You',
      'SuperMarioBrothers': 'Super Mario Brothers',
      'SweetChildOfMine': 'Sweet Child O\' Mine'
    };

    return titleMap[title] || title.replace(/([A-Z])/g, ' $1').trim();
  }

  async generateFromMIDITemplate(
    midiTemplatePath: string,
    voiceModelPath: string,
    lyrics: string,
    options: {
      preserveMelody?: boolean;
      adaptTempo?: boolean;
      customKey?: string;
      pitchShift?: number;
      indexRate?: number;
    } = {}
  ): Promise<string> {
    try {
      // Step 1: Analyze the MIDI template
      const midiAnalysis = await this.processMIDIFile(midiTemplatePath);
      logger.info(`Using MIDI template: ${midiAnalysis.title} - ${midiAnalysis.tempo} BPM, ${midiAnalysis.key}`);

      // Step 2: Generate base audio using MIDI as melodic reference
      const baseAudioPath = path.join(process.cwd(), 'uploads', `midi_base_${Date.now()}.wav`);
      await this.generateAudioFromMIDITemplate(midiTemplatePath, lyrics, baseAudioPath, options);

      // Step 3: Apply RVC voice conversion
      const finalOutputPath = path.join(process.cwd(), 'uploads', `rvc_midi_vocal_${Date.now()}.wav`);
      
      const rvcOptions: RVCConversionOptions = {
        inputAudioPath: baseAudioPath,
        outputAudioPath: finalOutputPath,
        modelPath: voiceModelPath,
        pitchShift: options.pitchShift || 0,
        indexRate: options.indexRate || 0.75,
        method: 'rmvpe'
      };

      const result = await this.convertVoice(rvcOptions);

      // Clean up temporary file
      await fs.unlink(baseAudioPath).catch(() => {});

      logger.info(`MIDI template conversion completed: ${result}`);
      return result;
    } catch (error) {
      logger.error('MIDI template generation failed:', error);
      throw error;
    }
  }

  private async generateAudioFromMIDITemplate(
    midiPath: string,
    lyrics: string,
    outputPath: string,
    options: {
      preserveMelody?: boolean;
      adaptTempo?: boolean;
      customKey?: string;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        'server/enhanced-rvc-pipeline.py',
        '--midi_path', midiPath,
        '--lyrics', lyrics,
        '--output_path', outputPath,
        '--mode', 'melody_template'
      ];

      if (options.preserveMelody) {
        args.push('--preserve_melody');
      }

      if (options.adaptTempo) {
        args.push('--adapt_tempo');
      }

      if (options.customKey) {
        args.push('--custom_key', options.customKey);
      }

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
          reject(new Error(`MIDI template processing failed: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async createMelodyVariation(
    originalMidiPath: string,
    variationStyle: 'jazz' | 'rock' | 'classical' | 'electronic' | 'acoustic',
    outputPath: string
  ): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const args = [
          'server/enhanced-rvc-pipeline.py',
          '--midi_path', originalMidiPath,
          '--output_path', outputPath,
          '--mode', 'variation',
          '--style', variationStyle
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
            resolve(outputPath);
          } else {
            reject(new Error(`Melody variation failed: ${stderr}`));
          }
        });

        process.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Melody variation failed:', error);
      throw error;
    }
  }
}

export default RVCIntegrationService;
