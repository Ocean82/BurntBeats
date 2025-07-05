
import { Router, Request, Response } from 'express';
import { pipelineCoordinator } from '../services/pipeline-coordinator';
import { Logger } from '../utils/logger';

const router = Router();
const logger = new Logger({ name: 'PipelineAPI' });

// Get pipeline status
router.get('/status/:pipelineId', (req: Request, res: Response) => {
  try {
    const { pipelineId } = req.params;
    const status = pipelineCoordinator.getPipelineStatus(pipelineId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    const overallProgress = pipelineCoordinator.getOverallProgress(pipelineId);

    res.json({
      success: true,
      pipelineId,
      overallProgress,
      stages: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get pipeline status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pipeline status'
    });
  }
});

// Initialize a new pipeline
router.post('/initialize', (req: Request, res: Response) => {
  try {
    const { pipelineId, stages } = req.body;

    if (!pipelineId || !stages || !Array.isArray(stages)) {
      return res.status(400).json({
        success: false,
        error: 'pipelineId and stages array are required'
      });
    }

    pipelineCoordinator.initializePipeline(pipelineId, stages);

    res.json({
      success: true,
      pipelineId,
      stages,
      message: 'Pipeline initialized successfully'
    });
  } catch (error) {
    logger.error('Failed to initialize pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize pipeline'
    });
  }
});

// Update stage progress
router.put('/stage/:pipelineId/:stageName/progress', (req: Request, res: Response) => {
  try {
    const { pipelineId, stageName } = req.params;
    const { progress } = req.body;

    if (typeof progress !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number'
      });
    }

    pipelineCoordinator.updateStageProgress(pipelineId, stageName, progress);

    res.json({
      success: true,
      pipelineId,
      stageName,
      progress,
      message: 'Stage progress updated'
    });
  } catch (error) {
    logger.error('Failed to update stage progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stage progress'
    });
  }
});

export default router;
