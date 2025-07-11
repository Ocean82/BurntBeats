
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';

interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  progress: number;
}

export class PipelineCoordinator extends EventEmitter {
  private logger = new Logger({ name: 'PipelineCoordinator' });
  private activePipelines = new Map<string, PipelineStage[]>();

  async initializePipeline(pipelineId: string, stages: string[]): Promise<void> {
    const pipelineStages: PipelineStage[] = stages.map(name => ({
      name,
      status: 'pending',
      progress: 0
    }));

    this.activePipelines.set(pipelineId, pipelineStages);
    
    this.logger.info('Pipeline initialized', {
      pipelineId,
      stages: stages.length
    });

    this.emit('pipeline:initialized', { pipelineId, stages: pipelineStages });
  }

  async startStage(pipelineId: string, stageName: string): Promise<void> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const stage = pipeline.find(s => s.name === stageName);
    if (!stage) {
      throw new Error(`Stage ${stageName} not found in pipeline ${pipelineId}`);
    }

    stage.status = 'running';
    stage.startTime = new Date();
    stage.progress = 0;

    this.logger.info('Pipeline stage started', {
      pipelineId,
      stageName
    });

    this.emit('stage:started', { pipelineId, stageName, stage });
  }

  async updateStageProgress(pipelineId: string, stageName: string, progress: number): Promise<void> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.find(s => s.name === stageName);
    if (!stage) return;

    stage.progress = Math.min(Math.max(progress, 0), 100);

    this.emit('stage:progress', { pipelineId, stageName, progress: stage.progress });
  }

  async completeStage(pipelineId: string, stageName: string): Promise<void> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.find(s => s.name === stageName);
    if (!stage) return;

    stage.status = 'completed';
    stage.endTime = new Date();
    stage.progress = 100;

    this.logger.info('Pipeline stage completed', {
      pipelineId,
      stageName,
      duration: stage.startTime ? stage.endTime.getTime() - stage.startTime.getTime() : 0
    });

    this.emit('stage:completed', { pipelineId, stageName, stage });

    // Check if all stages are complete
    const allCompleted = pipeline.every(s => s.status === 'completed');
    if (allCompleted) {
      this.emit('pipeline:completed', { pipelineId, pipeline });
      this.logger.info('Pipeline completed', { pipelineId });
    }
  }

  async failStage(pipelineId: string, stageName: string, error: string): Promise<void> {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) return;

    const stage = pipeline.find(s => s.name === stageName);
    if (!stage) return;

    stage.status = 'failed';
    stage.endTime = new Date();
    stage.error = error;

    this.logger.error('Pipeline stage failed', {
      pipelineId,
      stageName,
      error
    });

    this.emit('stage:failed', { pipelineId, stageName, stage, error });
    this.emit('pipeline:failed', { pipelineId, failedStage: stageName, error });
  }

  getPipelineStatus(pipelineId: string): PipelineStage[] | null {
    return this.activePipelines.get(pipelineId) || null;
  }

  getOverallProgress(pipelineId: string): number {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline || pipeline.length === 0) return 0;

    const totalProgress = pipeline.reduce((sum, stage) => sum + stage.progress, 0);
    return Math.round(totalProgress / pipeline.length);
  }

  cleanup(pipelineId: string): void {
    this.activePipelines.delete(pipelineId);
    this.emit('pipeline:cleanup', { pipelineId });
  }
}

export const pipelineCoordinator = new PipelineCoordinator();
