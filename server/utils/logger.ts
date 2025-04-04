import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type ErrorCode = 'AUTH_ERROR' | 'API_ERROR' | 'DB_ERROR' | 'VALIDATION_ERROR' | 'SYSTEM_ERROR';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  code?: ErrorCode;
  requestId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logDirectory: string;
  private readonly MAX_LOG_AGE_DAYS = 7;
  private readonly MAX_LOG_SIZE_MB = 10;

  private constructor() {
    this.logDirectory = path.join(process.cwd(), 'logs');
    this.initializeLogger();
  }

  private initializeLogger(): void {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory);
    }

    // Start log rotation check
    this.scheduleLogRotation();
  }

  private scheduleLogRotation(): void {
    // Check logs once per day
    setInterval(() => {
      this.rotateAndCleanupLogs();
    }, 24 * 60 * 60 * 1000);
  }

  private async rotateAndCleanupLogs(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.logDirectory);
      const now = new Date();

      for (const file of files) {
        const filePath = path.join(this.logDirectory, file);
        const stats = await fs.promises.stat(filePath);
        const fileAgeDays = (now.getTime() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24);
        const fileSizeMB = stats.size / (1024 * 1024);

        // Rotate if file is too old or too large
        if (fileAgeDays > this.MAX_LOG_AGE_DAYS || fileSizeMB > this.MAX_LOG_SIZE_MB) {
          const archiveName = `${file}.${stats.birthtime.toISOString()}.old`;
          await fs.promises.rename(filePath, path.join(this.logDirectory, archiveName));
        }
      }
    } catch (err) {
      console.error('Failed to rotate logs:', err);
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>, code?: ErrorCode): LogEntry {
    const entry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
      code,
      metadata: {
        ...metadata,
        hostname: process.env.REPL_SLUG || 'unknown',
        processId: process.pid,
        memory: process.memoryUsage(),
      }
    };

    // Add request ID if available through async storage
    const requestId = metadata?.requestId;
    if (requestId) {
      entry.requestId = requestId;
    }

    return entry;
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const logFile = path.join(this.logDirectory, `${entry.level}-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(entry) + '\n';

    try {
      await fs.promises.appendFile(logFile, logLine);
    } catch (err) {
      console.error('Failed to write log:', err);
      // Attempt to write to a fallback location
      const fallbackLog = path.join(process.cwd(), 'fallback.log');
      try {
        await fs.promises.appendFile(fallbackLog, logLine);
      } catch (fallbackErr) {
        console.error('Failed to write to fallback log:', fallbackErr);
      }
    }
  }

  public info(message: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry('info', message, metadata);
    this.writeLog(entry);
    console.log(`[INFO] ${message}`, metadata || '');
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry('warn', message, metadata);
    this.writeLog(entry);
    console.warn(`[WARN] ${message}`, metadata || '');
  }

  public error(message: string, error?: Error, metadata?: Record<string, any>, code: ErrorCode = 'SYSTEM_ERROR'): void {
    const entry = this.formatLogEntry('error', message, {
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code
      } : undefined
    }, code);
    this.writeLog(entry);
    console.error(`[ERROR] ${message}`, error || '', metadata || '');
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    if (process.env['NODE_ENV'] === 'development') {
      const entry = this.formatLogEntry('debug', message, metadata);
      this.writeLog(entry);
      console.debug(`[DEBUG] ${message}`, metadata || '');
    }
  }

  public async getRecentLogs(level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    const files = await fs.promises.readdir(this.logDirectory);

    for (const file of files) {
      if (level && !file.startsWith(level)) continue;

      const content = await fs.promises.readFile(path.join(this.logDirectory, file), 'utf-8');
      const entries = content
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as LogEntry)
        .slice(-limit);

      logs.push(...entries);
    }

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public async searchLogs(query: string, limit: number = 100): Promise<LogEntry[]> {
    const allLogs = await this.getRecentLogs(undefined, 1000);
    return allLogs
      .filter(log =>
        log.message.toLowerCase().includes(query.toLowerCase()) ||
        JSON.stringify(log.metadata).toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }
}

export const logger = Logger.getInstance();