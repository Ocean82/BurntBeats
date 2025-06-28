
import express from 'express';
import { voiceSampleProcessor } from '../scripts/process-voice-samples';
import { authenticate } from '../middleware/auth';
import { Logger } from '../utils/logger';

const router = express.Router();
const logger = new Logger({ name: 'VoiceProcessingAPI' });

// Process all voice samples from attached_assets
router.post('/process-all', authenticate, async (req, res) => {
  try {
    logger.info('Starting voice sample processing for all files', { userId: req.user?.id });
    
    await voiceSampleProcessor.processAllVoiceSamples();
    
    const status = await voiceSampleProcessor.getProcessingStatus();
    
    res.json({
      success: true,
      message: 'Voice samples processed successfully',
      data: status
    });

    logger.info('Voice sample processing completed', { 
      userId: req.user?.id,
      status 
    });

  } catch (error) {
    logger.error('Voice sample processing failed', { 
      error: error.message, 
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to process voice samples',
      error: error.message
    });
  }
});

// Process a specific file
router.post('/process-file', authenticate, async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    logger.info('Processing specific voice file', { 
      filename, 
      userId: req.user?.id 
    });
    
    await voiceSampleProcessor.processSingleFile(filename);
    
    res.json({
      success: true,
      message: `Voice file ${filename} processed successfully`
    });

    logger.info('Voice file processed successfully', { 
      filename, 
      userId: req.user?.id 
    });

  } catch (error) {
    logger.error('Voice file processing failed', { 
      error: error.message, 
      filename: req.body.filename,
      userId: req.user?.id 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to process voice file',
      error: error.message
    });
  }
});

// Get processing status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await voiceSampleProcessor.getProcessingStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get processing status', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get processing status'
    });
  }
});

export default router;
