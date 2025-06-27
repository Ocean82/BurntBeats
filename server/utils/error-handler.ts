
import { Response } from 'express';
import sanitize from 'sanitize-filename';
import { promisify } from 'util';
import { exec, ExecException } from 'child_process';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

export class ErrorHandler {
  private static readonly ERROR_ID_PREFIX = 'err';
  private static readonly ERROR_LOG_FORMAT = 'json';

  static handleError(
    res: Response,
    error: Error | unknown,
    message: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ): void {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    this.logError({
      errorId,
      message,
      error: errorMessage,
      stack: stackTrace,
      statusCode,
      timestamp,
      context
    });

    res.status(statusCode).json({
      error: message,
      errorId,
      timestamp,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }

  static handleValidationError(
    res: Response, 
    validationError: string | Record<string, string[]>,
    context?: Record<string, unknown>
  ): void {
    const error = typeof validationError === 'string' 
      ? new Error(validationError)
      : new Error('Validation failed');

    if (typeof validationError !== 'string') {
      error['details'] = validationError;
    }

    this.handleError(
      res, 
      error, 
      'Invalid request data', 
      400, 
      context
    );
  }

  static handleNotFound(
    res: Response, 
    resource: string,
    context?: Record<string, unknown>
  ): void {
    this.handleError(
      res, 
      new Error(`${resource} not found`), 
      `${resource} not found`, 
      404, 
      context
    );
  }

  static handleUnauthorized(
    res: Response, 
    message: string = 'Unauthorized',
    context?: Record<string, unknown>
  ): void {
    this.handleError(
      res, 
      new Error(message), 
      message, 
      401, 
      context
    );
  }

  static handleRateLimitExceeded(
    res: Response,
    context?: Record<string, unknown>
  ): void {
    this.handleError(
      res, 
      new Error('Rate limit exceeded'), 
      'Too many requests', 
      429, 
      context
    );
  }

  private static generateErrorId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${this.ERROR_ID_PREFIX}_${timestamp}_${random}`;
  }

  private static logError(errorData: Record<string, unknown>): void {
    if (this.ERROR_LOG_FORMAT === 'json') {
      console.error(JSON.stringify(errorData, null, 2));
    } else {
      console.error(`[${errorData.errorId}] ${errorData.message}`, errorData);
    }
  }
}

export class FileUtils {
  private static readonly ALLOWED_EXTENSIONS = new Set([
    'wav', 'mp3', 'aiff', 'flac', 'mid', 'midi', 'zip'
  ]);

  static sanitizeFilename(filename: string): string {
    const sanitized = sanitize(filename)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255); // Limit filename length

    // Ensure the file has an extension
    if (!path.extname(sanitized)) {
      return `${sanitized}.tmp`;
    }

    return sanitized;
  }

  static generateUniqueFilename(
    prefix: string, 
    originalName: string,
    userId: string
  ): string {
    const extension = path.extname(originalName).substring(1) || 'tmp';
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const sanitizedPrefix = this.sanitizeFilename(prefix);

    return `${sanitizedPrefix}_${userId}_${timestamp}_${random}.${extension}`;
  }

  static validateFilePath(
    filePath: string, 
    allowedDirectory: string
  ): { isValid: boolean; resolvedPath: string } {
    try {
      const resolvedPath = path.resolve(filePath);
      const resolvedAllowedDir = path.resolve(allowedDirectory);

      return {
        isValid: resolvedPath.startsWith(resolvedAllowedDir + path.sep),
        resolvedPath
      };
    } catch (error) {
      return {
        isValid: false,
        resolvedPath: ''
      };
    }
  }

  static validateFileExtension(filename: string): boolean {
    const extension = path.extname(filename).substring(1).toLowerCase();
    return this.ALLOWED_EXTENSIONS.has(extension);
  }

  static async safeDelete(filePath: string): Promise<boolean> {
    try {
      const { isValid } = this.validateFilePath(filePath, path.dirname(filePath));
      if (!isValid) return false;

      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export class CommandExecutor {
  static async executeCommand(
    command: string, 
    options: {
      timeout?: number;
      cwd?: string;
      env?: NodeJS.ProcessEnv;
      shell?: string;
    } = {}
  ): Promise<{ stdout: string; stderr: string }> {
    const {
      timeout = 30000,
      cwd = process.cwd(),
      env = process.env,
      shell = '/bin/bash'
    } = options;

    try {
      console.log(`Executing command: ${this.redactSensitiveInfo(command)}`);

      const sanitizedCommand = this.sanitizeCommand(command);
      const result = await execAsync(sanitizedCommand, { 
        timeout, 
        cwd, 
        env, 
        shell 
      });

      return result;
    } catch (error) {
      const execError = error as ExecException;
      console.error('Command execution error:', {
        command: this.redactSensitiveInfo(command),
        error: execError.message,
        code: execError.code,
        signal: execError.signal
      });

      throw new Error(`Command failed: ${execError.message}`);
    }
  }

  static sanitizeCommandArgs(args: string[]): string[] {
    return args.map(arg => {
      // Remove potentially dangerous characters
      let sanitized = arg.replace(/[;&|`$(){}[\]\\<>]/g, '');

      // Truncate very long arguments
      if (sanitized.length > 1024) {
        sanitized = sanitized.substring(0, 1024);
      }

      return sanitized;
    });
  }

  private static redactSensitiveInfo(command: string): string {
    // Redact potential secrets from command logs
    return command.replace(/(password|key|secret|token)=[^\s]+/gi, '$1=*****');
  }

  static async executeSafeCommand(
    executable: string,
    args: string[],
    options?: {
      timeout?: number;
      cwd?: string;
      env?: NodeJS.ProcessEnv;
    }
  ): Promise<{ stdout: string; stderr: string }> {
    const sanitizedArgs = this.sanitizeCommandArgs(args);
    const fullCommand = `${executable} ${sanitizedArgs.join(' ')}`;

    return this.executeCommand(fullCommand, options);
  }
}
