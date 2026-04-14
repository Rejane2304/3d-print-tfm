/**
 * Logger Centralizado
 *
 * Reemplaza console.log/error/warn con un sistema estructurado
 * que controla qué se loguea según el entorno.
 *
 * En producción: envía a servicio de monitoreo (Sentry, DataDog, etc.)
 * En desarrollo: muestra en consola formateada
 * En test: silencioso (para no contaminar output de tests)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMeta {
  [key: string]: unknown;
}

export interface LoggerConfig {
  level: LogLevel;
  environment: string;
}

// Configuración por entorno
const getLogLevel = (): LogLevel => {
  const env = process.env.NODE_ENV;
  switch (env) {
    case 'production':
      return 'warn'; // Solo warnings y errores en prod
    case 'test':
      return 'error'; // Solo errores críticos en tests
    case 'development':
    default:
      // En desarrollo, mostrar todos los niveles de log
      return 'debug'; // Mostrar todo en desarrollo
  }
};

// Prioridad de niveles
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private readonly config: LoggerConfig;

  constructor() {
    this.config = {
      level: getLogLevel(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (meta && Object.keys(meta).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(meta)}`;
    }
    return `${prefix} ${message}`;
  }

  debug(message: string, meta?: LogMeta): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    if (this.config.environment !== 'test') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: LogMeta): void {
    if (!this.shouldLog('info')) {
      return;
    }

    if (this.config.environment !== 'test') {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: LogMeta): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    if (this.config.environment !== 'test') {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, error?: unknown, meta?: LogMeta): void {
    if (!this.shouldLog('error')) {
      return;
    }

    const errorMeta = this.buildErrorMeta(error, meta);

    if (this.config.environment === 'production') {
      this.sendToMonitoringService(message, error, errorMeta);
    }

    if (this.config.environment !== 'test') {
      console.error(this.formatMessage('error', message, errorMeta));
    }
  }

  private buildErrorMeta(error: unknown, meta?: LogMeta): LogMeta {
    const errorMeta: LogMeta = { ...meta };
    if (error instanceof Error) {
      errorMeta.errorName = error.name;
      errorMeta.errorMessage = error.message;
      errorMeta.stack = error.stack;
    } else if (error !== undefined) {
      errorMeta.error = error;
    }
    return errorMeta;
  }

  private sendToMonitoringService(message: string, error: unknown, errorMeta: LogMeta): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monitoringService = (
      globalThis as unknown as { monitoringService?: { captureException: (err: Error, meta: LogMeta) => void } }
    ).monitoringService;
    if (monitoringService) {
      try {
        monitoringService.captureException(error instanceof Error ? error : new Error(message), errorMeta);
      } catch (caughtError) {
        // Log the caught exception for debugging/monitoring
        if (this.config.environment !== 'test') {
          console.error(
            this.formatMessage('error', 'Error sending to monitoring service', {
              originalError: errorMeta,
              caughtException: caughtError instanceof Error ? {
                name: caughtError.name,
                message: caughtError.message,
                stack: caughtError.stack,
              } : caughtError,
            }),
          );
        }
        // Optionally, rethrow or handle as needed
        // throw caughtError;
      }
    }
  }

  // Método para errores de API con contexto estructurado
  apiError(route: string, method: string, error: unknown, requestId?: string): void {
    this.error(`API Error in ${method} ${route}`, error, {
      route,
      method,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // Método para performance metrics
  performance(operation: string, durationMs: number, meta?: LogMeta): void {
    this.info(`Performance: ${operation} took ${durationMs}ms`, {
      operation,
      durationMs,
      ...meta,
    });
  }

  // Método para eventos de negocio
  business(event: string, meta?: LogMeta): void {
    this.info(`[BUSINESS] ${event}`, meta);
  }

  // Método para security events
  security(event: string, meta?: LogMeta): void {
    this.warn(`[SECURITY] ${event}`, meta);
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar clase para testing
export { Logger };

// Exportar helper para reemplazar console.* en archivos existentes
export function replaceConsoleWithLogger(): void {
  if (process.env.NODE_ENV === 'production') {
    // En producción, silenciar console.log/info/debug
    // Solo permitir warn y error
    console.log = (...args: unknown[]) => {
      logger.info('console.log called', { args });
      // No llamar a console original para evitar logs no estructurados
    };

    console.info = (...args: unknown[]) => {
      logger.info('console.info called', { args });
    };

    console.debug = (...args: unknown[]) => {
      logger.debug('console.debug called', { args });
    };
  }
}

// Exportar para uso directo
export default logger;
