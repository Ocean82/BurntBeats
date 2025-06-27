export class Logger {
  static info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta || '');
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '');
  }

  static warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  static debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta || '');
    }
  }
}