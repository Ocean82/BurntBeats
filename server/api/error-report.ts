
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

interface ErrorReport {
  error: {
    message: string;
    stack?: string;
    timestamp: string;
    component?: string;
    retryCount: number;
  };
  userAgent: string;
  url: string;
  sessionId?: string;
}

class ErrorLogger {
  private static logDir = path.join(process.cwd(), 'logs');
  
  static async ensureLogDirectory() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }
  
  static async logError(report: ErrorReport) {
    await this.ensureLogDirectory();
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      source: 'client',
      ...report
    };
    
    const logFile = path.join(
      this.logDir, 
      `client-errors-${timestamp.split('T')[0]}.log`
    );
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(logFile, logLine);
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Client Error:', report.error.message);
        if (report.error.stack) {
          console.error(report.error.stack);
        }
      }
      
      // Clean up old log files (keep last 7 days)
      this.cleanupOldLogs();
      
    } catch (writeError) {
      console.error('Failed to write error log:', writeError);
    }
  }
  
  static async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < oneWeekAgo) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
  
  static async getErrorSummary() {
    await this.ensureLogDirectory();
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `client-errors-${today}.log`);
      
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      
      const errors = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      // Group by error message
      const errorGroups = errors.reduce((groups, error) => {
        const key = error.error.message;
        if (!groups[key]) {
          groups[key] = {
            message: key,
            count: 0,
            lastSeen: error.timestamp,
            components: new Set()
          };
        }
        groups[key].count++;
        groups[key].lastSeen = error.timestamp;
        if (error.error.component) {
          groups[key].components.add(error.error.component);
        }
        return groups;
      }, {} as Record<string, any>);
      
      // Convert sets to arrays for JSON serialization
      Object.values(errorGroups).forEach((group: any) => {
        group.components = Array.from(group.components);
      });
      
      return Object.values(errorGroups);
      
    } catch (error) {
      return [];
    }
  }
}

export async function reportError(req: Request, res: Response) {
  try {
    const report: ErrorReport = req.body;
    
    // Validate the report
    if (!report.error || !report.error.message) {
      return res.status(400).json({ 
        error: 'Invalid error report format' 
      });
    }
    
    // Add session info if available
    if (req.session?.id) {
      report.sessionId = req.session.id;
    }
    
    // Log the error
    await ErrorLogger.logError(report);
    
    res.json({ 
      success: true, 
      message: 'Error report logged successfully' 
    });
    
  } catch (error) {
    console.error('Error in error reporting endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to log error report' 
    });
  }
}

export async function getErrorSummary(req: Request, res: Response) {
  try {
    const summary = await ErrorLogger.getErrorSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting error summary:', error);
    res.status(500).json({ 
      error: 'Failed to get error summary' 
    });
  }
}
