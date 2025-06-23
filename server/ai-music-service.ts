
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface AIGenerationOptions {
  title: string;
  lyrics: string;
  genre: string;
  tempo?: number;
  key?: string;
  duration?: number;
  useAI?: boolean;
  trainOnData?: string;
  modelPath?: string;
  temperature?: number;
}

export interface AIGenerationResult {
  audioPath: string;
  metadata: {
    aiEnhanced: boolean;
    modelUsed: boolean;
    processingTime: number;
    features: {
      lstmGenerated: boolean;
      enhancedHarmony: boolean;
      trainingDataUsed: boolean;
    };
  };
}

export class AIMusicService {
  private modelPath: string;
  private trainingDataPath: string;

  constructor() {
    this.modelPath = path.join('models', 'lstm_music_model.h5');
    this.trainingDataPath = path.join('training_data');
  }

  async generateAIMusic(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const startTime = Date.now();
    console.log(`🤖 Starting AI music generation: ${options.title}`);

    try {
      // Prepare output path
      const timestamp = Date.now();
      const filename = `ai_generated_${timestamp}.mid`;
      const outputPath = path.join('uploads', filename);

      // Ensure directories exist
      await fs.mkdir('uploads', { recursive: true });
      await fs.mkdir('models', { recursive: true });

      // Prepare arguments for Python AI generator
      const args = [
        'server/ai-music21-generator.py',
        `"${options.title}"`,
        `"${options.lyrics}"`,
        options.genre,
        (options.tempo || 120).toString(),
        options.key || this.getKeyFromGenre(options.genre),
        (options.duration || 30).toString(),
        outputPath
      ];

      // Add optional AI-specific arguments
      if (options.trainOnData) {
        args.push(`--train=${options.trainOnData}`);
      }

      if (await this.modelExists()) {
        args.push(`--model=${this.modelPath}`);
      }

      // Execute AI music generation
      await this.executePythonScript(args);

      // Check if file was created
      const fileExists = await this.fileExists(outputPath);
      if (!fileExists) {
        throw new Error('AI music generation failed - no output file created');
      }

      // Load metadata if available
      const metadataPath = outputPath.replace('.mid', '_ai_metadata.json');
      let aiMetadata = {};
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        aiMetadata = JSON.parse(metadataContent);
      } catch {
        // Metadata not available
      }

      const processingTime = Date.now() - startTime;

      return {
        audioPath: `/${outputPath}`,
        metadata: {
          aiEnhanced: true,
          modelUsed: await this.modelExists(),
          processingTime,
          features: {
            lstmGenerated: aiMetadata['ai_features']?.['lstm_model'] || false,
            enhancedHarmony: aiMetadata['ai_features']?.['enhanced_harmony'] || false,
            trainingDataUsed: aiMetadata['ai_features']?.['training_data_used'] || false
          }
        }
      };

    } catch (error) {
      console.error('AI music generation failed:', error);
      throw new Error(`AI music generation failed: ${error.message}`);
    }
  }

  async trainAIModel(trainingDataPath: string, epochs: number = 50): Promise<boolean> {
    console.log('🎓 Starting AI model training...');

    try {
      const args = [
        'server/ai-music21-generator.py',
        '"Training Session"',
        '"Training lyrics"',
        'classical',
        '120',
        'C',
        '30',
        'temp_output.mid',
        `--train=${trainingDataPath}`
      ];

      await this.executePythonScript(args);
      
      // Check if model was created
      const modelExists = await this.modelExists();
      if (modelExists) {
        console.log('✅ AI model training completed successfully');
        return true;
      } else {
        console.log('⚠️  Model training completed but model file not found');
        return false;
      }

    } catch (error) {
      console.error('AI model training failed:', error);
      return false;
    }
  }

  async isAIAvailable(): Promise<boolean> {
    try {
      // Check if Python AI script exists
      const scriptPath = path.join('server', 'ai-music21-generator.py');
      await fs.access(scriptPath);

      // Test if ML libraries are available
      const testResult = await this.executePythonScript([
        '-c', 
        'try:\n  import tensorflow\n  import sklearn\n  print("ML_AVAILABLE")\nexcept:\n  print("ML_NOT_AVAILABLE")'
      ]);

      return testResult.includes('ML_AVAILABLE');
    } catch {
      return false;
    }
  }

  async getAICapabilities() {
    return {
      available: await this.isAIAvailable(),
      modelTrained: await this.modelExists(),
      features: {
        lstm_generation: true,
        pattern_learning: true,
        style_transfer: true,
        harmony_enhancement: true,
        rhythm_variation: true
      }
    };
  }

  private async modelExists(): Promise<boolean> {
    try {
      await fs.access(this.modelPath);
      return true;
    } catch {
      return false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getKeyFromGenre(genre: string): string {
    const genreKeys = {
      'pop': 'C',
      'rock': 'E',
      'jazz': 'F',
      'electronic': 'Am',
      'classical': 'D',
      'hip-hop': 'Cm',
      'country': 'G',
      'r&b': 'Bb'
    };
    return genreKeys[genre.toLowerCase() as keyof typeof genreKeys] || 'C';
  }

  private executePythonScript(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', args);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(data.toString());
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(data.toString());
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }
}

export const aiMusicService = new AIMusicService();
