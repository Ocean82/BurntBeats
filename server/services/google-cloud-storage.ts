
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { Logger } from '../utils/logger';

const logger = new Logger({ name: 'GoogleCloudStorage' });

export class GoogleCloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(bucketName?: string) {
    this.bucketName = bucketName || 'burnt-beats-storage';
    
    // Initialize Google Cloud Storage
    try {
      const keyFile = process.env.GOOGLE_CLOUD_KEY_FILE;
      
      if (keyFile) {
        // Parse the key file from environment variable
        const credentials = JSON.parse(keyFile);
        this.storage = new Storage({
          projectId: credentials.project_id,
          credentials: credentials
        });
      } else {
        // Fallback to default credentials (useful for local development)
        this.storage = new Storage();
      }
      
      logger.info('Google Cloud Storage initialized', { bucket: this.bucketName });
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage', { error: error.message });
      throw new Error('Google Cloud Storage initialization failed');
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, contentType?: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const stream = file.createWriteStream({
        metadata: {
          contentType: contentType || 'application/octet-stream',
        },
        resumable: false,
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          logger.error('Upload failed', { error: error.message, fileName });
          reject(error);
        });

        stream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          logger.info('File uploaded successfully', { fileName, publicUrl });
          resolve(publicUrl);
        });

        stream.end(fileBuffer);
      });
    } catch (error) {
      logger.error('Failed to upload file', { error: error.message, fileName });
      throw new Error('File upload failed');
    }
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [buffer] = await file.download();
      logger.info('File downloaded successfully', { fileName, size: buffer.length });
      return buffer;
    } catch (error) {
      logger.error('Failed to download file', { error: error.message, fileName });
      throw new Error('File download failed');
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.delete();
      logger.info('File deleted successfully', { fileName });
    } catch (error) {
      logger.error('Failed to delete file', { error: error.message, fileName });
      throw new Error('File deletion failed');
    }
  }

  async getSignedUrl(fileName: string, action: 'read' | 'write' = 'read', expiresIn = 3600): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const options = {
        version: 'v4' as const,
        action,
        expires: Date.now() + expiresIn * 1000,
      };

      const [url] = await file.getSignedUrl(options);
      logger.info('Signed URL generated', { fileName, action, expiresIn });
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { error: error.message, fileName });
      throw new Error('Signed URL generation failed');
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      logger.error('Failed to check file existence', { error: error.message, fileName });
      return false;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const options = prefix ? { prefix } : {};

      const [files] = await bucket.getFiles(options);
      const fileNames = files.map(file => file.name);
      
      logger.info('Files listed successfully', { count: fileNames.length, prefix });
      return fileNames;
    } catch (error) {
      logger.error('Failed to list files', { error: error.message, prefix });
      throw new Error('File listing failed');
    }
  }

  getPublicUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }
}

export const googleCloudStorage = new GoogleCloudStorageService();
