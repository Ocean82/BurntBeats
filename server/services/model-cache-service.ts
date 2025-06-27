
import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger';
import { env } from '../config/env';

const logger = new Logger({ name: 'ModelCacheService' });

export class ModelCacheService {
  private cacheDir: string;
  private loadedModels: Map<string, any> = new Map();

  constructor() {
    this.cacheDir = env.MODEL_CACHE_PATH;
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      logger.info('Model cache initialized', { cacheDir: this.cacheDir });
    } catch (error) {
      logger.error('Failed to initialize model cache', { error: error.message });
    }
  }

  async cacheModel(modelId: string, modelData: Buffer): Promise<string> {
    try {
      const modelPath = path.join(this.cacheDir, `${modelId}.model`);
      await fs.writeFile(modelPath, modelData);
      logger.info('Model cached successfully', { modelId, path: modelPath });
      return modelPath;
    } catch (error) {
      logger.error('Failed to cache model', { error: error.message, modelId });
      throw new Error('Model caching failed');
    }
  }

  async getModelPath(modelId: string): Promise<string | null> {
    try {
      const modelPath = path.join(this.cacheDir, `${modelId}.model`);
      await fs.access(modelPath);
      return modelPath;
    } catch {
      return null;
    }
  }

  async loadModel(modelId: string): Promise<any> {
    if (this.loadedModels.has(modelId)) {
      logger.info('Model loaded from memory cache', { modelId });
      return this.loadedModels.get(modelId);
    }

    const modelPath = await this.getModelPath(modelId);
    if (!modelPath) {
      throw new Error(`Model ${modelId} not found in cache`);
    }

    try {
      // This would load the actual model based on your AI framework
      // For now, returning a placeholder
      const model = { id: modelId, path: modelPath };
      this.loadedModels.set(modelId, model);
      logger.info('Model loaded successfully', { modelId });
      return model;
    } catch (error) {
      logger.error('Failed to load model', { error: error.message, modelId });
      throw new Error('Model loading failed');
    }
  }

  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        await fs.unlink(path.join(this.cacheDir, file));
      }
      this.loadedModels.clear();
      logger.info('Model cache cleared');
    } catch (error) {
      logger.error('Failed to clear model cache', { error: error.message });
    }
  }

  async getCacheStats(): Promise<{ size: number; count: number }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const stats = await fs.stat(path.join(this.cacheDir, file));
        totalSize += stats.size;
      }

      return { size: totalSize, count: files.length };
    } catch (error) {
      logger.error('Failed to get cache stats', { error: error.message });
      return { size: 0, count: 0 };
    }
  }
}

export const modelCacheService = new ModelCacheService();
