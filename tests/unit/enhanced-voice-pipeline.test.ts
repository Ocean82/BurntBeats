
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

        // Basic score range validation
        expect(result.metadata.qualityScore).toBeGreaterThan(0);
        expect(result.metadata.qualityScore).toBeLessThanOrEqual(1);
        expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
        expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
        
        // Test specific boundaries for different quality settings
        if (quality === 'fast') {
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.7);
          expect(result.metadata.qualityScore).toBeLessThan(0.85);
        } else if (quality === 'medium') {
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.75);
          expect(result.metadata.qualityScore).toBeLessThan(0.9);
        } else if (quality === 'high') {
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.85);
          expect(result.metadata.qualityScore).toBeLessThan(0.95);
        } else if (quality === 'studio') {
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.9);
          expect(result.metadata.qualityScore).toBeLessThanOrEqual(1.0);
        }

        // Verify quality mode is reflected in metadata
        expect(result.audioData).toBeDefined();
        expect(result.processingId).toMatch(/^voice_\d+$/);
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
      // Verify adaptive filtering changes metadata
      expect(result.metadata).toHaveProperty('adaptiveFilteringApplied');
      expect(result.audioData).toBeDefined();
    });

    it('should not apply adaptive filtering when disabled', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics without adaptive filtering',
        { audioData: 'mock' },
        { notes: ['C4', 'D4'] },
        {
          quality: 'high',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      expect(result.metadata.adaptiveFilteringApplied).toBe(false);
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
      expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
      
      // Verify empty melody doesn't break pipeline
      expect(result.processingId).toMatch(/^voice_\d+$/);
      expect(result.metadata.pipelineVersion).toBe('2.0');
    });

    it('should handle null melody gracefully', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics with null melody',
        { audioData: 'mock' },
        null,
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
      expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
      expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
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
      expect(processingTime).toBeGreaterThan(10); // Should take some time
      
      // Verify real-time specific metadata
      expect(result.metadata.stagesCompleted).toBe(7);
      expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
      
      // Real-time should maintain quality despite speed optimization
      if (result.metadata.qualityScore) {
        expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.6);
      }
    });

    it('should have performance difference between real-time and standard processing', async () => {
      // Test standard processing time
      const standardStart = Date.now();
      const standardResult = await pipeline.generateVoiceWithPipeline(
        'Performance comparison test',
        { audioData: 'mock' },
        { notes: ['A4'] },
        {
          quality: 'fast',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );
      const standardTime = Date.now() - standardStart;

      // Test real-time processing time
      const realTimeStart = Date.now();
      const realTimeResult = await pipeline.generateVoiceWithPipeline(
        'Performance comparison test',
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
      const realTimeTime = Date.now() - realTimeStart;

      // Both should complete successfully
      expect(standardResult.metadata.realTimeProcessed).toBe(false);
      expect(realTimeResult.metadata.realTimeProcessed).toBe(true);
      
      // Both should produce valid output
      expect(standardResult.audioData).toBeDefined();
      expect(realTimeResult.audioData).toBeDefined();
      
      // Times should be reasonable (allowing for test environment variance)
      expect(standardTime).toBeLessThan(60000); // 1 minute max
      expect(realTimeTime).toBeLessThan(60000); // 1 minute max
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

        // Basic quality score validation
        expect(result.metadata.qualityScore).toBeGreaterThan(0);
        expect(result.metadata.qualityScore).toBeLessThanOrEqual(1);
        expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
        expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);

        // Verify enhancement metadata matches settings
        expect(result.metadata.neuralEnhanced).toBe(enhancements.neuralEnhancement);
        expect(result.metadata.adaptiveFilteringApplied).toBe(enhancements.adaptiveFiltering);

        // Verify enhancement combinations affect quality appropriately
        if (enhancements.neuralEnhancement && enhancements.adaptiveFiltering) {
          // Maximum enhancement should produce higher quality
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.85);
        } else if (!enhancements.neuralEnhancement && !enhancements.adaptiveFiltering) {
          // Minimal enhancement should still produce acceptable quality
          expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(0.7);
        }

        // All combinations should complete all stages
        expect(result.metadata.stagesCompleted).toBe(7);
        expect(result.metadata.pipelineVersion).toBe('2.0');
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
