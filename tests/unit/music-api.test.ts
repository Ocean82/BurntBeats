import { Request, Response } from 'express';
import { MusicAPI } from '../../server/api/music-api';
import { jest } from '@jest/globals';

describe('MusicAPI', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { id: 1, email: 'test@example.com' }
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    } as any;
  });

  describe('generateSong', () => {
    it('should generate song with valid parameters', async () => {
      mockReq.body = {
        lyrics: 'Test lyrics for the song',
        genre: 'pop',
        mood: 'happy',
        tempo: 120,
        voiceSampleId: 1
      };

      await MusicAPI.generateSong(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          song: expect.objectContaining({
            lyrics: expect.any(String),
            genre: 'pop',
            mood: 'happy'
          })
        })
      );
    });

    it('should validate required fields', async () => {
      mockReq.body = { genre: 'pop' }; // Missing lyrics

      await MusicAPI.generateSong(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle generation errors gracefully', async () => {
      mockReq.body = {
        lyrics: '',
        genre: 'invalid-genre'
      };

      await MusicAPI.generateSong(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserSongs', () => {
    it('should return user songs', async () => {
      await MusicAPI.getUserSongs(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          songs: expect.any(Array)
        })
      );
    });
  });
});