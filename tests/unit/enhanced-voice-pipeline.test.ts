
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

    it('should apply adaptive filtering when enabled', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics for adaptive filtering',
        { audioData: 'mock-audio', duration: 10 },
        { notes: ['C4', 'D4', 'E4'] },
        {
          quality: 'high',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: true
        }
      );

      // Assert adaptive filtering changes metadata
      expect(result.metadata.adaptiveFilteringApplied).toBe(true);
      expect(result.metadata.filteringParameters).toBeDefined();
      expect(result.metadata.filteringParameters.dynamicEqApplied).toBe(true);
      expect(result.metadata.filteringParameters.adaptiveBandwidths).toEqual(
        expect.arrayContaining([expect.any(Number)])
      );
    });

    it('should handle spectral correction metadata updates', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test spectral correction',
        { audioData: 'mock-audio' },
        { notes: ['C4'] },
        {
          quality: 'studio',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: true,
          adaptiveFiltering: false
        }
      );

      expect(result.metadata.spectralCorrectionApplied).toBe(true);
      expect(result.metadata.spectralParameters).toBeDefined();
      expect(result.metadata.spectralParameters.frequencyBands).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty melody gracefully', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics with no melody',
        { audioData: 'mock-audio', duration: 5 },
        { notes: [] }, // Empty melody
        {
          quality: 'medium',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      // Should fill in silence or handle gracefully
      expect(result.audioData).toBeDefined();
      expect(result.metadata.melodyHandling).toBe('silence_filled');
      expect(result.metadata.warnings).toContain('Empty melody provided, filled with silence');
      expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
    });

    it('should handle null melody input', async () => {
      const result = await pipeline.generateVoiceWithPipeline(
        'Test lyrics with null melody',
        { audioData: 'mock-audio' },
        null,
        {
          quality: 'fast',
          realTimeProcessing: false,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      expect(result.metadata.melodyHandling).toBe('default_generated');
      expect(result.metadata.warnings).toContain('No melody provided, using default pattern');
    });
  });

  describe('score range validation', () => {
    it('should respect quality score boundaries for all quality settings', async () => {
      const qualitySettings = ['studio', 'high', 'medium', 'fast'] as const;
      
      for (const quality of qualitySettings) {
        const result = await pipeline.generateVoiceWithPipeline(
          'Quality score boundary test',
          { audioData: 'mock-audio', duration: 10 },
          { notes: ['C4', 'E4', 'G4'] },
          {
            quality,
            realTimeProcessing: false,
            neuralEnhancement: true,
            spectralCorrection: true,
            adaptiveFiltering: true
          }
        );

        // Assert score boundaries
        expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
        expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
        
        // Fast quality should have lower baseline scores
        if (quality === 'fast') {
          expect(result.qualityMetrics.overallScore).toBeGreaterThanOrEqual(0.4);
          expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(0.8);
        }
        
        // Studio quality should have higher baseline scores  
        if (quality === 'studio') {
          expect(result.qualityMetrics.overallScore).toBeGreaterThanOrEqual(0.7);
          expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1.0);
        }

        // Validate individual metric scores
        expect(result.qualityMetrics.clarity).toBeGreaterThanOrEqual(0);
        expect(result.qualityMetrics.clarity).toBeLessThanOrEqual(1);
        expect(result.qualityMetrics.naturalness).toBeGreaterThanOrEqual(0);
        expect(result.qualityMetrics.naturalness).toBeLessThanOrEqual(1);
      }
    });

    it('should maintain score consistency with edge settings', async () => {
      // Test with minimal processing (fast mode)
      const fastResult = await pipeline.generateVoiceWithPipeline(
        'Fast processing test',
        { audioData: 'mock-audio' },
        { notes: ['C4'] },
        {
          quality: 'fast',
          realTimeProcessing: true,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );

      // Test with maximum processing (studio mode)
      const studioResult = await pipeline.generateVoiceWithPipeline(
        'Studio processing test',
        { audioData: 'mock-audio' },
        { notes: ['C4'] },
        {
          quality: 'studio',
          realTimeProcessing: false,
          neuralEnhancement: true,
          spectralCorrection: true,
          adaptiveFiltering: true
        }
      );

      // Studio should generally score higher than fast
      expect(studioResult.qualityMetrics.overallScore).toBeGreaterThanOrEqual(
        fastResult.qualityMetrics.overallScore
      );

      // Both should respect boundaries
      expect(fastResult.qualityMetrics.overallScore).toBeGreaterThan(0);
      expect(studioResult.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('timing and performance', () => {
    it('should complete processing within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const result = await pipeline.generateVoiceWithPipeline(
        'Performance timing test with longer lyrics to simulate real usage',
        { audioData: 'mock-audio', duration: 15 },
        { notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'] },
        {
          quality: 'high',
          realTimeProcessing: false,
          neuralEnhancement: true,
          spectralCorrection: true,
          adaptiveFiltering: true
        }
      );
      
      const processingTime = Date.now() - startTime;
      
      // Should complete within 5 seconds for mock processing
      expect(processingTime).toBeLessThan(5000);
      expect(result.metadata.processingTimeMs).toBeDefined();
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should be faster with real-time processing enabled', async () => {
      // Real-time processing test
      const rtStartTime = Date.now();
      const rtResult = await pipeline.generateVoiceWithPipeline(
        'Real-time test',
        { audioData: 'mock-audio' },
        { notes: ['C4', 'E4'] },
        {
          quality: 'medium',
          realTimeProcessing: true,
          neuralEnhancement: false,
          spectralCorrection: false,
          adaptiveFiltering: false
        }
      );
      const rtTime = Date.now() - rtStartTime;

      // Standard processing test
      const stdStartTime = Date.now();
      const stdResult = await pipeline.generateVoiceWithPipeline(
        'Standard test',
        { audioData: 'mock-audio' },
        { notes: ['C4', 'E4'] },
        {
          quality: 'medium',
          realTimeProcessing: false,
          neuralEnhancement: true,
          spectralCorrection: true,
          adaptiveFiltering: true
        }
      );
      const stdTime = Date.now() - stdStartTime;

      // Real-time should be faster (though this is simulated)
      expect(rtResult.metadata.realTimeOptimized).toBe(true);
      expect(rtResult.metadata.processingTimeMs).toBeLessThanOrEqual(stdResult.metadata.processingTimeMs);
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

    it('should validate quality setting boundaries', async () => {
      await expect(
        pipeline.generateVoiceWithPipeline(
          'Test',
          { audioData: 'mock' },
          { notes: [] },
          {
            quality: 'invalid' as any,
            realTimeProcessing: false,
            neuralEnhancement: false,
            spectralCorrection: false,
            adaptiveFiltering: false
          }
        )
      ).rejects.toThrow('Invalid quality setting');
    });
  });
});
