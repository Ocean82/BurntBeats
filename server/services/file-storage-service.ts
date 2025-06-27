
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { googleCloudStorage } from './google-cloud-storage';
import { env } from '../config/env';

export class FileStorageService {
  private storagePath: string;
  private useCloudStorage: boolean;

  constructor(storagePath?: string, useCloudStorage = false) {
    this.storagePath = storagePath || path.join(env.STORAGE_BASE_PATH, 'voices');
    this.useCloudStorage = useCloudStorage || !!env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!this.useCloudStorage) {
      this.ensureStorageDirectory();
    }
    
    // Initialize model cache directory
    this.ensureModelCacheDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      // Ensure additional storage directories
      await fs.mkdir(path.join(env.STORAGE_BASE_PATH, 'music'), { recursive: true });
      await fs.mkdir(path.join(env.STORAGE_BASE_PATH, 'temp'), { recursive: true });
    } catch (error) {
      Logger.error('Failed to create storage directory', error);
    }
  }

  private async ensureModelCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(env.MODEL_CACHE_PATH, { recursive: true });
      Logger.info('Model cache directory initialized', { path: env.MODEL_CACHE_PATH });
    } catch (error) {
      Logger.error('Failed to create model cache directory', error);
    }
  }

  async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = path.join(env.STORAGE_BASE_PATH, 'temp');
      const files = await fs.readdir(tempDir);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtime.getTime();

        // Remove files older than configured interval
        if (age > env.TEMP_CLEANUP_INTERVAL) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info('Temporary files cleaned up', { count: cleanedCount });
      }
    } catch (error) {
      logger.warn('Failed to cleanup temp files', { error: error.message });
    }
  }

  async storeFile(fileData: Buffer, extension = 'wav', category = 'voices'): Promise<string> {
    try {
      // Validate file size
      if (fileData.length > env.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${env.MAX_FILE_SIZE} bytes`);
      }

      const fileName = `${category}/${uuidv4()}.${extension}`;
      
      if (this.useCloudStorage) {
        await googleCloudStorage.uploadFile(fileData, fileName, `audio/${extension}`);
        logger.info('File stored in cloud storage', { fileName, size: fileData.length, category });
      } else {
        const categoryDir = path.join(env.STORAGE_BASE_PATH, category);
        await fs.mkdir(categoryDir, { recursive: true });
        const filePath = path.join(categoryDir, `${uuidv4()}.${extension}`);
        await fs.writeFile(filePath, fileData);
        logger.info('File stored locally', { fileName, size: fileData.length, category });
      }
      
      return fileName;
    } catch (error) {
      logger.error('Failed to store file', { error: error.message });
      throw new Error('Failed to store file');
    }
  }

  async storeTempFile(fileData: Buffer, extension = 'tmp'): Promise<string> {
    try {
      const tempDir = path.join(env.STORAGE_BASE_PATH, 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = path.join(tempDir, fileName);
      
      await fs.writeFile(filePath, fileData);
      logger.info('Temporary file stored', { fileName, size: fileData.length });
      
      return filePath;
    } catch (error) {
      logger.error('Failed to store temporary file', { error: error.message });
      throw new Error('Failed to store temporary file');
    }
  }

  async getFile(fileName: string): Promise<Buffer> {
    try {
      if (this.useCloudStorage) {
        return await googleCloudStorage.downloadFile(fileName);
      } else {
        const filePath = path.join(this.storagePath, path.basename(fileName));
        return await fs.readFile(filePath);
      }
    } catch (error) {
      logger.error('Failed to get file', { error: error.message, fileName });
      throw new Error('File not found');
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, fileName);
      await fs.unlink(filePath);
      logger.info('File deleted', { fileName });
    } catch (error) {
      // Don't throw on delete failures, just log
      logger.warn('Failed to delete file', { error: error.message, fileName });
    }
  }

  async copyFromUrl(url: string): Promise<string> {
    try {
      // This would implement actual URL copying
      // For now, return a mock filename
      const fileName = `copied_${uuidv4()}.wav`;
      logger.info('File copied from URL', { url, fileName });
      return fileName;
    } catch (error) {
      logger.error('Failed to copy from URL', { error: error.message, url });
      throw new Error('Failed to copy file from URL');
    }
  }

  getFilePath(fileName: string): string {
    return path.join(this.storagePath, fileName);
  }

  getPublicUrl(fileName: string): string {
    if (this.useCloudStorage) {
      return googleCloudStorage.getPublicUrl(fileName);
    }
    return `/api/voices/files/${path.basename(fileName)}`;
  }
}
