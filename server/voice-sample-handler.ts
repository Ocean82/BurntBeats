
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for voice sample uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `voice_sample_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const voiceSampleUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimes = [
      'audio/wav',
      'audio/mp3', 
      'audio/mpeg',
      'audio/webm',
      'audio/ogg',
      'audio/flac'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for voice samples'));
    }
  }
});

export class VoiceSampleHandler {
  static async validateVoiceSample(filePath: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      
      // Check file size (minimum 1KB, maximum 50MB)
      if (stats.size < 1024 || stats.size > 50 * 1024 * 1024) {
        return false;
      }
      
      // Check file extension
      const allowedExtensions = ['.wav', '.mp3', '.webm', '.ogg', '.flac'];
      const ext = path.extname(filePath).toLowerCase();
      
      return allowedExtensions.includes(ext);
    } catch (error) {
      return false;
    }
  }

  static async processVoiceSampleBlob(blob: Buffer | Blob): Promise<string> {
    try {
      const filename = `voice_sample_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
      const filePath = path.join(uploadsDir, filename);
      
      if (blob instanceof Buffer) {
        fs.writeFileSync(filePath, blob);
      } else {
        // Handle Blob type from browser
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);
      }
      
      // Validate the saved file
      if (await this.validateVoiceSample(filePath)) {
        return filePath;
      } else {
        // Clean up invalid file
        fs.unlinkSync(filePath);
        throw new Error('Invalid voice sample format or size');
      }
    } catch (error) {
      throw new Error(`Failed to process voice sample blob: ${error.message}`);
    }
  }

  static getVoiceSampleUrl(filePath: string): string {
    const filename = path.basename(filePath);
    return `/uploads/${filename}`;
  }
}

// Helper function to load voice sample for music generation
export async function loadVoiceSample(voiceSampleId: number | string): Promise<any> {
  try {
    if (typeof voiceSampleId === 'string' && voiceSampleId.startsWith('/uploads/')) {
      // Direct file path
      const fullPath = path.join(process.cwd(), voiceSampleId);
      if (fs.existsSync(fullPath)) {
        return {
          filePath: voiceSampleId,
          buffer: fs.readFileSync(fullPath)
        };
      }
    }
    
    // For now, return null if voice sample not found
    // In a real implementation, this would query the database
    console.warn(`Voice sample not found: ${voiceSampleId}`);
    return null;
  } catch (error) {
    console.error(`Error loading voice sample: ${error.message}`);
    return null;
  }
}
