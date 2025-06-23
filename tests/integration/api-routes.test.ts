
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('API Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('GET /api/health should return system status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    it('GET /api/system-status should return detailed status', async () => {
      const response = await request(app)
        .get('/api/system-status')
        .expect(200);

      expect(response.body).toMatchObject({
        system: expect.objectContaining({
          memory: expect.any(Object),
          cpu: expect.any(Object)
        }),
        services: expect.any(Object)
      });
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/register should create new user', async () => {
      const userData = {
        email: 'integration-test@example.com',
        password: 'securepassword123',
        name: 'Integration Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          email: userData.email,
          name: userData.name
        })
      });
    });

    it('POST /api/auth/login should authenticate user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.any(Object)
      });
    });
  });

  describe('Music Generation Endpoints', () => {
    it('POST /api/music/generate should create song', async () => {
      const songData = {
        lyrics: 'This is a test song for integration testing',
        genre: 'pop',
        mood: 'happy',
        tempo: 120
      };

      const response = await request(app)
        .post('/api/music/generate')
        .send(songData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        song: expect.objectContaining({
          lyrics: songData.lyrics,
          genre: songData.genre
        })
      });
    }, 30000);

    it('GET /api/music should return user songs', async () => {
      const response = await request(app)
        .get('/api/music')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        songs: expect.any(Array)
      });
    });
  });

  describe('Voice Processing Endpoints', () => {
    it('POST /api/voice/generate-enhanced should process voice', async () => {
      const voiceData = {
        lyrics: 'Test lyrics for voice processing',
        voiceSample: { audioData: 'mock-audio-data' },
        melody: { notes: ['C4', 'D4', 'E4'] },
        options: {
          quality: 'high',
          realTimeProcessing: false,
          neuralEnhancement: true,
          spectralCorrection: true,
          adaptiveFiltering: true
        }
      };

      const response = await request(app)
        .post('/api/voice/generate-enhanced')
        .send(voiceData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        voice: expect.objectContaining({
          audioData: expect.any(Object),
          qualityMetrics: expect.any(Object)
        })
      });
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/auth/login')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });
});
