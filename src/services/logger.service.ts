/**
 * Centralized Logger Service for Drift App
 *
 * Provides environment-aware logging with different verbosity levels
 * for development, preview, and production builds.
 *
 * Usage:
 *   import { Logger } from '@/services/logger.service';
 *   Logger.info('Component', 'User logged in', { userId: '123' });
 *   Logger.error('PaymentService', 'Payment failed', error);
 */

import Constants from 'expo-constants';

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean;

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Environment types
type Environment = 'development' | 'preview' | 'production';

// Log entry structure
interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  data?: any;
  environment: Environment;
}

// Configuration for each environment
const ENV_CONFIG: Record<Environment, { logLevel: LogLevel; enableConsole: boolean }> = {
  development: { logLevel: LogLevel.DEBUG, enableConsole: true },
  preview: { logLevel: LogLevel.INFO, enableConsole: true },
  production: { logLevel: LogLevel.ERROR, enableConsole: false },
};

class LoggerService {
  private environment: Environment;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    this.environment = this.detectEnvironment();
    const config = ENV_CONFIG[this.environment];
    this.logLevel = config.logLevel;
    this.enableConsole = config.enableConsole;

    console.log(`🔧 Logger initialized for ${this.environment} environment (level: ${LogLevel[this.logLevel]})`);
  }

  /**
   * Detect current environment based on Expo configuration
   */
  private detectEnvironment(): Environment {
    // Check for EAS build profile
    const releaseChannel = Constants.expoConfig?.extra?.eas?.releaseChannel;
    const appVariant = process.env.APP_VARIANT;

    // Check if running in development
    if (__DEV__) {
      return 'development';
    }

    // Check release channel for preview/production
    if (releaseChannel === 'preview' || appVariant === 'preview') {
      return 'preview';
    }

    if (releaseChannel === 'production' || appVariant === 'production') {
      return 'production';
    }

    // Default to production for safety in unknown builds
    return 'production';
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Override log level (useful for debugging in preview/production)
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    console.log(`🔧 Log level changed to ${LogLevel[level]}`);
  }

  /**
   * Enable/disable console output
   */
  setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * Get buffered logs (useful for displaying in-app or sending to server)
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, component: string, message: string, data?: any): void {
    // Check if this log level should be output
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      component,
      message,
      data,
      environment: this.environment,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Console output
    if (this.enableConsole) {
      const prefix = this.getLogPrefix(level);
      const formattedMessage = `${prefix} [${component}] ${message}`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data !== undefined ? data : '');
          break;
        case LogLevel.INFO:
          console.log(formattedMessage, data !== undefined ? data : '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data !== undefined ? data : '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data !== undefined ? data : '');
          break;
      }
    }
  }

  /**
   * Get emoji prefix for log level
   */
  private getLogPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return '📝';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📋';
    }
  }

  // Public logging methods
  debug(component: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, component, message, data);
  }

  info(component: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, component, message, data);
  }

  warn(component: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, component, message, data);
  }

  error(component: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, component, message, data);
  }

  // Convenience methods for common scenarios

  /**
   * Log API call
   */
  api(method: string, endpoint: string, status?: number, data?: any): void {
    const statusEmoji = status && status >= 200 && status < 300 ? '✅' : '❌';
    this.info('API', `${statusEmoji} ${method} ${endpoint} ${status || ''}`, data);
  }

  /**
   * Log navigation event
   */
  navigation(screen: string, params?: any): void {
    this.debug('Navigation', `Navigated to ${screen}`, params);
  }

  /**
   * Log user action
   */
  action(component: string, action: string, data?: any): void {
    this.info(component, `User action: ${action}`, data);
  }

  /**
   * Log performance metric
   */
  performance(component: string, operation: string, durationMs: number): void {
    const emoji = durationMs < 100 ? '⚡' : durationMs < 1000 ? '🕐' : '🐌';
    this.debug('Performance', `${emoji} ${component}.${operation}: ${durationMs}ms`);
  }

  /**
   * Start a timed operation (returns stop function)
   */
  startTimer(component: string, operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.performance(component, operation, duration);
    };
  }

  /**
   * Log Firebase operation
   */
  firebase(operation: string, collection: string, success: boolean, data?: any): void {
    const emoji = success ? '🔥✅' : '🔥❌';
    this.info('Firebase', `${emoji} ${operation} on ${collection}`, data);
  }

  /**
   * Log authentication event
   */
  auth(event: string, userId?: string, data?: any): void {
    this.info('Auth', `🔐 ${event}`, { userId, ...data });
  }

  /**
   * Log trip/ride event
   */
  trip(tripId: string, event: string, data?: any): void {
    this.info('Trip', `🚗 [${tripId.slice(-6)}] ${event}`, data);
  }

  /**
   * Log payment event
   */
  payment(event: string, amount?: number, data?: any): void {
    this.info('Payment', `💳 ${event}${amount ? ` $${amount.toFixed(2)}` : ''}`, data);
  }
}

// Export singleton instance
export const Logger = new LoggerService();

// Export for testing/advanced use cases
export { LoggerService };
