import { Request, Response } from 'express';
import { AuthAPI } from '../../server/api/auth-api';
import { jest } from '@jest/globals';

describe('AuthAPI', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    } as any;
    mockNext = jest.fn();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      await AuthAPI.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.any(Object)
        })
      );
    });

    it('should reject invalid credentials', async () => {
      mockReq.body = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      await AuthAPI.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });

    it('should validate required fields', async () => {
      mockReq.body = { email: 'test@example.com' }; // Missing password

      await AuthAPI.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      mockReq.body = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User'
      };

      await AuthAPI.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: 'newuser@example.com',
            name: 'New User'
          })
        })
      );
    });

    it('should reject duplicate email', async () => {
      mockReq.body = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      };

      await AuthAPI.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });
});