
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { googleCloudStorage } from './google-cloud-storage';

const logger = new Logger({ name: 'FileStorageService' });

export class FileStorageService {
  private storagePath: string;
  private useCloudStorage: boolean;

  constructor(storagePath?: string, useCloudStorage = false) {
    this.storagePath = storagePath || path.join(process.cwd(), 'uploads', 'voices');
    this.useCloudStorage = useCloudStorage || !!process.env.GOOGLE_CLOUD_KEY_FILE;
    
    if (!this.useCloudStorage) {
      this.ensureStorageDirectory();
    }
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create storage directory', { error: error.message });
    }
  }

  async storeFile(fileData: Buffer, extension = 'wav'): Promise<string> {
    try {
      const fileName = `voices/${uuidv4()}.${extension}`;
      
      if (this.useCloudStorage) {
        await googleCloudStorage.uploadFile(fileData, fileName, `audio/${extension}`);
        logger.info('File stored in cloud storage', { fileName, size: fileData.length });
      } else {
        const filePath = path.join(this.storagePath, path.basename(fileName));
        await fs.writeFile(filePath, fileData);
        logger.info('File stored locally', { fileName, size: fileData.length });
      }
      
      return fileName;
    } catch (error) {
      logger.error('Failed to store file', { error: error.message });
      throw new Error('Failed to store file');
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
