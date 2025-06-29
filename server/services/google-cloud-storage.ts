
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
      // Use the complete service account credentials
      const serviceAccount = {
        type: 'service_account',
        project_id: 'aqueous-thought-464214-j3',
        private_key_id: 'daf5dc3d10c4d4ab8fc57a1a12d64133dc6e8a12',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDJauSK5LfDqoxQ\nZ6ReUDXD4agCZii3iOOhiRB/I7hDAMDbN7CjjDzqvNp26rAEEOtxkkKdOLLIExeT\nQSMoq/Oe5Iz2WeTGxqS402zCcU9OYg7vHJDNHcluLiKTuogU5fxgNldspn2Zgc+H\nSB1FODIU3JboSNFlV4BlUwa2qlacxyHsPsxf5GW4kK7p+p9Ugk1YJMXyA+Q7ibYr\nLcp9RiA/VUzPqR36S+O+tYENAcCFV+oo9jzOeC64Vv9t7Dd6U5KX2molFNTw+4Us\nOScURCTcdqBNwjILUgjY/YAv2qeuYDIUOKuznccsUqvHZ6+3XefcKvbhCcIhCaQ5\nDcMwItBVAgMBAAECggEAEu1bDZxBkn7/0XxzyzMRYlddsOAFun2AGollRfVG1vEG\nrnL0w+GlRc+6Xcte//rRDSqX3OtbjYaRxBIuah+CdK94eZvn7i/zgbTIdxsrvyti\nyOBv0P6YE6T9NdGlAQW9qhLhM0IP8nFq3YUOzxbhSemSusBBARtwYtUi/95Q5kl7\nNqnVam1M35sSMDYlKaP057bc0MuDNO1aQFsp3HrSniKPVgakPIKcDjOOOTepzLGI\n8RWNhcsIE3E7MPTw6ius9uwjtiUIj7QoHZgXL4iYfJwIh0agnk9Lwgzklrgua7Gi\n6xwxpZMQeNs5dJUbmJGIeGPeKij+F5X22jtLCkqWHwKBgQD+tSQkPVJO31zLfYiS\nBjPKFbZPZ4TExFUvrUy/Cv8R0MtwP4ACbduJylZn6/k4LGT9ml57kTIzJ/Qpxol6\nz6t7Y+zTu7qiRXxGaH1smB721DO7DTXz0WxA1JLtq8tDxyCAi3TTXX68fpnGClKK\nWnn2lRcdLA5cqiii1iw83vW/+wKBgQDKcId1jllV7sIfr7CI5exOG2MyXKyj8nlq\n9vN4qW5wQ+G9HOmkbXS2nmcvtc/aaOW4bNGNLl5o3qBJxI+y32HwJSVol1Z4Dwtx\nUoNER5HxcAP/HZ+uRt7bekxoltvRkP3dcPEKSmkytmGR1yoMKjvWbXO53UFjJ3Bm\nE/T8/eiv7wKBgQDc3jsO6dX76xjOpHbPGW3DaXyD8qJg9ldgVojciS6SRlqDZa0d\nbiIXpEu1Jh0gpu6UM06HHGtJjPXfW/hPdNGg2A+/s2St3k9bxrQsfOUs6OpK47PL\nT+jtduhKDNTgW0ZF8ahGuSZzUd0KrFzS+I4WU0aN12xE0pEWU15dEoJMDQKBgQDG\nmAYLSQ5SwtslgpFIe2aKaUuzCD9ExoZebM0EvhJdh/pYL5j1eXtZ+6N2poG13doe\nRoJ8YdS0RFIyi+X8sC/ACnDcXjqxpPCwxyWHQj7l/+Gr0D/qFBRkc2Gp6PTUbcze\nBAIy+jShT1IAZHgXXwc8oDs7RtbykqotOb7Iwb4XeQKBgQCs0NgBlp1454ZCv9b+\nmYxSgdL1BePGo1gOKRHAzccr0EVWKG/aU1lpy0ESs31hqu9P090jGKuPCini3e6l\nYTnr964L/qyyYMELKQFI7nU1Lrh9dkFXawNSvbEK3/wmltUqwmwgGl6TbUA2Y8zE\nIfVG2xeHulvlWvWdFy7m9aDRw==\n-----END PRIVATE KEY-----\n',
        client_email: 'burnt-beats-access@aqueous-thought-464214-j3.iam.gserviceaccount.com',
        client_id: '110246502677114856190',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/burnt-beats-access%40aqueous-thought-464214-j3.iam.gserviceaccount.com',
        universe_domain: 'googleapis.com'
      };

      this.storage = new Storage({
        projectId: serviceAccount.project_id,
        credentials: serviceAccount
      });
      
      Logger.info('Google Cloud Storage initialized with service account', { 
        bucket: this.bucketName,
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email
      });
      return;
      
      // Try individual credential components
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
