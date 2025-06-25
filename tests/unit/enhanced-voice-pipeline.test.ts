
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

    it('should handle different quality settings with proper score boundaries', async () => {
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
        
        // Test specific boundaries for different quality settings
        if (quality === 'fast') {
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.7);
        } else if (quality === 'studio') {
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.9);
        }
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

    it('should apply adaptive filtering when enabled', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics for adaptive filtering',
        { audioData: 'mock' },
        { notes: ['C4', 'D4'] },
        {
          quality: 'high',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: true
        }
      );

      expect(result.metadata.adaptiveFilteringApplied).toBe(true);
    });

    it('should handle empty melody gracefully', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics with no melody',
        { audioData: 'mock' },
        { notes: [] },
        {
          quality: 'medium',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      expect(result.audioData).toBeDefined();
      expect(result.metadata.stagesCompleted).toBe(7);
      // Should handle empty melody without throwing errors
      expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
    });

    it('should process with real-time enhancement when enabled', async () => {
      const startTime = Date.now();
      
      const result = await pipeline.generateVoiceWithPipeline(
        'Real-time test',
        { audioData: 'mock' },
        { notes: ['A4'] },
        {
          quality: 'fast',
          realTimeProcessing: true,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      const processingTime = Date.now() - startTime;
      
      expect(result.metadata.realTimeProcessed).toBe(true);
      expect(result.audioData).toBeDefined();
      // Real-time processing should complete within reasonable time
      expect(processingTime).toBeLessThan(30000); // 30 seconds max
    });

    it('should maintain quality score boundaries for all enhancement combinations', async () => {
      const enhancementCombinations = [
        { neuralEnhancement: true, spectralCorrection: true, adaptiveFiltering: true },
        { neuralEnhancement: false, spectralCorrection: true, adaptiveFiltering: false },
        { neuralEnhancement: true, spectralCorrection: false, adaptiveFiltering: true },
        { neuralEnhancement: false, spectralCorrection: false, adaptiveFiltering: false }
      ];

      for (const enhancements of enhancementCombinations) {
        const result = await pipeline.generateVoiceWithPipeline(
          'Quality boundary test',
          { audioData: 'mock' },
          { notes: ['C4'] },
          {
            quality: 'high',
            realTimeProcessing: false,
            ...enhancements
          }
        );

        expect(result.metadata.qualityScore).toBeGreaterThan(0);
        expect(result.metadata.qualityScore).toBeLessThanOrEqual(1);
        expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
        expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
      }
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
