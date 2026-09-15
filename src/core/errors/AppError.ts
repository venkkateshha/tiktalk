/**
 * TikTalk Application Error Architecture
 * Strongly-typed error hierarchy for production resilience
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export class AppError extends Error {
  readonly code: string;
  readonly severity: ErrorSeverity;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    severity: ErrorSeverity = 'error',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.timestamp = Date.now();
    this.context = context;
  }
}

export class NetworkError extends AppError {
  readonly status?: number;

  constructor(message: string = 'Network request failed', status?: number, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 'error', context);
    this.name = 'NetworkError';
    this.status = status;
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 'error', context);
    this.name = 'AuthError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied', context?: Record<string, unknown>) {
    super(message, 'PERMISSION_DENIED', 'error', context);
    this.name = 'PermissionError';
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 'warning', { fieldErrors });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}
