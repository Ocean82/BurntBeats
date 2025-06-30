
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { Logger } from '../utils/logger';

export class GoogleCloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(bucketName?: string) {
    this.bucketName = bucketName || 'burnt-beats-storage';
    
    // Initialize Google Cloud Storage
    try {
      // Try individual credential components from environment variables
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const privateKeyRaw = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
      const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
      
      if (projectId && privateKeyRaw && clientEmail) {
        // Format the private key properly - it might be raw key content
        let privateKey = privateKeyRaw;
        
        // If it doesn't start with BEGIN, assume it's raw key content and format it
        if (!privateKey.includes('BEGIN PRIVATE KEY')) {
          privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
        }
        
        // Replace escaped newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        this.storage = new Storage({
          projectId: projectId,
          credentials: {
            private_key: privateKey,
            client_email: clientEmail
          }
        });
        Logger.info('Google Cloud Storage initialized with individual credentials', { 
          bucket: this.bucketName,
          projectId: projectId,
          clientEmail: clientEmail
        });
      } else {
        // Use local file storage as fallback
        Logger.warn('Google Cloud Storage credentials not found, using local storage fallback');
        this.storage = null as any; // Will be handled by fallback methods
      }
      
    } catch (error) {
      Logger.error('Failed to initialize Google Cloud Storage', error);
      this.storage = null as any; // Will be handled by fallback methods
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, contentType?: string): Promise<string> {
    if (!this.storage) {
      return this.uploadFileLocally(fileBuffer, fileName);
    }

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
          Logger.error('Upload failed', error);
          reject(error);
        });

        stream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          Logger.info('File uploaded successfully', { fileName, publicUrl });
          resolve(publicUrl);
        });

        stream.end(fileBuffer);
      });
    } catch (error: any) {
      Logger.error('Failed to upload file', { error: error.message, fileName });
      return this.uploadFileLocally(fileBuffer, fileName);
    }
  }

  private async uploadFileLocally(fileBuffer: Buffer, fileName: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    
    const publicUrl = `/uploads/${fileName}`;
    Logger.info('File uploaded locally', { fileName, publicUrl });
    return publicUrl;
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [buffer] = await file.download();
      Logger.info('File downloaded successfully', { fileName, size: buffer.length });
      return buffer;
    } catch (error: any) {
      Logger.error('Failed to download file', { error: error.message, fileName });
      throw new Error('File download failed');
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.delete();
      Logger.info('File deleted successfully', { fileName });
    } catch (error: any) {
      Logger.error('Failed to delete file', { error: error.message, fileName });
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
      Logger.info('Signed URL generated', { fileName, action, expiresIn });
      return url;
    } catch (error: any) {
      Logger.error('Failed to generate signed URL', { error: error.message, fileName });
      throw new Error('Signed URL generation failed');
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [exists] = await file.exists();
      return exists;
    } catch (error: any) {
      Logger.error('Failed to check file existence', { error: error.message, fileName });
      return false;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const options = prefix ? { prefix } : {};

      const [files] = await bucket.getFiles(options);
      const fileNames = files.map(file => file.name);
      
      Logger.info('Files listed successfully', { count: fileNames.length, prefix });
      return fileNames;
    } catch (error: any) {
      Logger.error('Failed to list files', { error: error.message, prefix });
      throw new Error('File listing failed');
    }
  }

  getPublicUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }
}

export const googleCloudStorage = new GoogleCloudStorageService();
