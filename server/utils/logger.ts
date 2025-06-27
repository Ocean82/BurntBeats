
interface LoggerConfig {
  name: string;
  level: string;
}

export class Logger {
  private static log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'BurntBeats',
      message,
      ...data,
    };

    // Use appropriate console method based on level
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(JSON.stringify(logEntry));
        }
        break;
      default:
        console.log(JSON.stringify(logEntry));
    }
  }

  static info(message: string, data?: any) {
    Logger.log('info', message, data);
  }

  static warn(message: string, data?: any) {
    Logger.log('warn', message, data);
  }

  static error(message: string, data?: any) {
    Logger.log('error', message, data);
  }

  static debug(message: string, data?: any) {
    Logger.log('debug', message, data);
  }
}
