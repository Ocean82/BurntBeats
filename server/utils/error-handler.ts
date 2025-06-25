
import { Response } from 'express';
import sanitize from 'sanitize-filename';

export class ErrorHandler {
  static handleError(res: Response, error: any, message: string, statusCode: number = 500): void {
    const errorId = this.generateErrorId();
    
    console.error(`[${errorId}] ${message}:`, {
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
      error: message,
      errorId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  static handleValidationError(res: Response, validationError: string): void {
    this.handleError(res, new Error(validationError), 'Invalid request data', 400);
  }

  static handleNotFound(res: Response, resource: string): void {
    this.handleError(res, new Error(`${resource} not found`), `${resource} not found`, 404);
  }

  static handleUnauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.handleError(res, new Error(message), message, 401);
  }

  static handleRateLimitExceeded(res: Response): void {
    this.handleError(res, new Error('Rate limit exceeded'), 'Too many requests', 429);
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class FileUtils {
  static sanitizeFilename(filename: string): string {
    return sanitize(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  static generateUniqueFilename(prefix: string, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.sanitizeFilename(prefix)}_${timestamp}_${random}.${extension}`;
  }

  static validateFilePath(filePath: string, allowedDirectory: string): boolean {
    const resolvedPath = require('path').resolve(filePath);
    const resolvedAllowedDir = require('path').resolve(allowedDirectory);
    return resolvedPath.startsWith(resolvedAllowedDir);
  }
}

export class CommandExecutor {
  static async executeCommand(command: string, timeout: number = 30000): Promise<{ stdout: string; stderr: string }> {
    const { promisify } = require('util');
    const { exec } = require('child_process');
    const execAsync = promisify(exec);

    try {
      console.log(`Executing command: ${command}`);
      const result = await execAsync(command, { timeout });
      return result;
    } catch (error) {
      console.error('Command execution error:', error);
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  static sanitizeCommandArgs(args: string[]): string[] {
    return args.map(arg => arg.replace(/[;&|`$(){}[\]\\]/g, ''));
  }
}
