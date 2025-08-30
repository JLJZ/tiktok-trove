import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  service: string;
}

class Logger {
  private logLevel: LogLevel;
  private logStream?: NodeJS.WritableStream;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.initializeFileLogging();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LogLevel[level as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private initializeFileLogging(): void {
    if (process.env.LOG_FILE) {
      try {
        const logDir = join(process.cwd(), 'logs');
        if (!existsSync(logDir)) {
          mkdirSync(logDir, { recursive: true });
        }
        
        const logPath = join(logDir, process.env.LOG_FILE);
        this.logStream = createWriteStream(logPath, { flags: 'a' });
      } catch (error) {
        console.error('Failed to initialize file logging:', error);
      }
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'user-service',
      ...(data && { data }),
    };

    return JSON.stringify(entry);
  }

  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level > this.logLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, data);
    
    // Console output
    if (process.env.NODE_ENV === 'development') {
      const colorCode = this.getColorCode(levelName);
      console.log(`${colorCode}[${levelName}]${this.getColorCode('RESET')} ${message}`, data || '');
    } else {
      console.log(formattedMessage);
    }

    // File output
    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  private getColorCode(level: string): string {
    const colors: Record<string, string> = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m', // White
      RESET: '\x1b[0m',  // Reset
    };
    return colors[level] || '\x1b[0m';
  }

  public error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }
}

export const logger = new Logger();