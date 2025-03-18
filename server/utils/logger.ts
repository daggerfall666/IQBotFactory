import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logDirectory: string;

  private constructor() {
    this.logDirectory = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory);
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: {
        ...metadata,
        processId: process.pid,
        memory: process.memoryUsage(),
      }
    };
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const logFile = path.join(this.logDirectory, `${entry.level}-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(entry) + '\n';

    try {
      await fs.promises.appendFile(logFile, logLine);
    } catch (err) {
      console.error('Failed to write log:', err);
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

  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = this.formatLogEntry('error', message, {
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
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
}

export const logger = Logger.getInstance();