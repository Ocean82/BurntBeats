
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

const logger = new Logger({ name: 'FileStorageService' });

export class FileStorageService {
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || path.join(process.cwd(), 'uploads', 'voices');
    this.ensureStorageDirectory();
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
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = path.join(this.storagePath, fileName);
      
      await fs.writeFile(filePath, fileData);
      logger.info('File stored', { fileName, size: fileData.length });
      
      return fileName;
    } catch (error) {
      logger.error('Failed to store file', { error: error.message });
      throw new Error('Failed to store file');
    }
  }

  async getFile(fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.storagePath, fileName);
      return await fs.readFile(filePath);
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
    return `/api/voices/files/${fileName}`;
  }
}
