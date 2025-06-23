
import { EnhancedVoicePipeline } from '../../server/enhanced-voice-pipeline';

describe('EnhancedVoicePipeline', () => {
  let pipeline: EnhancedVoicePipeline;

  beforeEach(() => {
    pipeline = new EnhancedVoicePipeline();
  });

  describe('generateVoiceWithPipeline', () => {
    it('should complete all 7 processing stages', async () => {
      const mockLyrics = 'Test lyrics for voice generation';
      const mockVoiceSample = { audioData: 'mock-audio', duration: 10 };
      const mockMelody = { notes: ['C4', 'D4', 'E4'] };
      const mockOptions = {
        quality: 'high' as const,
        realTimeProcessing: false,
        neuralEnhancement: true,
        spectralCorrection: true,
        adaptiveFiltering: true
      };

      const result = await pipeline.generateVoiceWithPipeline(
        mockLyrics,
        mockVoiceSample,
        mockMelody,
        mockOptions
      );

      expect(result).toMatchObject({
        audioData: expect.any(Object),
        processingId: expect.stringMatching(/^voice_\d+$/),
        qualityMetrics: expect.objectContaining({
          overallScore: expect.any(Number)
        }),
        metadata: expect.objectContaining({
          pipelineVersion: '2.0',
          stagesCompleted: 7,
          neuralEnhanced: true
        })
      });
    });

    it('should handle different quality settings', async () => {
      const testCases = ['studio', 'high', 'medium', 'fast'] as const;

      for (const quality of testCases) {
        const result = await pipeline.generateVoiceWithPipeline(
          'Test lyrics',
          { audioData: 'mock' },
          { notes: [] },
          {
            quality,
            realTimeProcessing: false,
            neuralEnhancement: false,
            spectralCorrection: false,
            adaptiveFiltering: false
          }
        );

        expect(result.metadata.qualityScore).toBeGreaterThan(0);
        expect(result.metadata.qualityScore).toBeLessThanOrEqual(1);
      }
    });

    it('should apply neural enhancement when enabled', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test',
        { audioData: 'mock' },
        { notes: [] },
        {
          quality: 'high',
          realTimeProcessing: false,
          neuralEnhancement: true,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      expect(result.metadata.neuralEnhanced).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid input gracefully', async () => {
      await expect(
        pipeline.generateVoiceWithPipeline(
          '',
          null,
          null,
          {
            quality: 'high',
            realTimeProcessing: false,
            neuralEnhancement: false,
            spectralCorrection: false,
            adaptiveFiltering: false
          }
        )
      ).rejects.toThrow();
    });
  });
});
