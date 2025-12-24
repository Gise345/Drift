/**
 * DEBUG LOGGER
 * Captures console.log calls and stores them for in-app viewing
 * Useful for debugging on preview/production builds
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 200;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private nextId: number = 1;
  private isEnabled: boolean = true;
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
  }

  /**
   * Initialize the logger and intercept console methods
   */
  init() {
    // Override console methods to capture logs
    console.log = (...args: any[]) => {
      this.capture('log', args);
      this.originalConsole.log(...args);
    };

    console.info = (...args: any[]) => {
      this.capture('info', args);
      this.originalConsole.info(...args);
    };

    console.warn = (...args: any[]) => {
      this.capture('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
      this.capture('error', args);
      this.originalConsole.error(...args);
    };

    this.log('🔧 Debug Logger initialized');
  }

  /**
   * Capture a log entry
   */
  private capture(level: LogLevel, args: any[]) {
    if (!this.isEnabled) return;

    // Convert args to string message
    const message = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const entry: LogEntry = {
      id: this.nextId++,
      timestamp: new Date(),
      level,
      message,
    };

    this.logs.unshift(entry); // Add to beginning (newest first)

    // Trim if too many logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Add a log entry directly (without going through console)
   */
  log(message: string, data?: any) {
    this.capture('log', data ? [message, data] : [message]);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by search term
   */
  searchLogs(term: string): LogEntry[] {
    const lowerTerm = term.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerTerm)
    );
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to log updates
   */
  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of log changes
   */
  private notifyListeners() {
    const logs = this.getLogs();
    this.listeners.forEach(callback => callback(logs));
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Export logs as string
   */
  exportLogs(): string {
    return this.logs
      .map(log => {
        const time = log.timestamp.toISOString();
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}`;
      })
      .join('\n');
  }
}

// Singleton instance
export const debugLogger = new DebugLogger();

// Export types
export type { LogEntry, LogLevel };
