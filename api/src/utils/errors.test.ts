import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  errorHandler,
  handleDatabaseError,
} from './errors';

describe('errors utils', () => {
  it('creates typed errors', () => {
    const dbError = new DatabaseError('boom');
    const notFound = new NotFoundError('Product', 1);
    const validation = new ValidationError('bad data');
    const conflict = new ConflictError('already exists');

    expect(dbError.code).toBe('DATABASE_ERROR');
    expect(notFound.statusCode).toBe(404);
    expect(validation.message).toContain('Validation error');
    expect(conflict.message).toContain('Conflict');
  });

  it('converts unknown errors to DatabaseError', () => {
    expect(() => handleDatabaseError(new Error('db down'))).toThrow(DatabaseError);
    expect(() => handleDatabaseError('plain failure')).toThrow('Database operation failed');
  });

  it('rethrows existing DatabaseError instances', () => {
    const e = new DatabaseError('existing', 'CODE', 500);
    expect(() => handleDatabaseError(e)).toThrow(e);
  });

  it('handles sqlite-like errors and no-rows message', () => {
    const uniqueError = Object.assign(new DatabaseError('SQLITE_CONSTRAINT: UNIQUE failed', 'SQLITE_CONSTRAINT'));
    const foreignKeyError = Object.assign(new DatabaseError('SQLITE_CONSTRAINT: FOREIGN KEY failed', 'SQLITE_CONSTRAINT'));
    const genericConstraint = Object.assign(new DatabaseError('SQLITE_CONSTRAINT: CHECK failed', 'SQLITE_CONSTRAINT'));
    const busyError = Object.assign(new DatabaseError('database is locked', 'SQLITE_BUSY'));
    const noRowsError = new DatabaseError('No rows affected');

    expect(() => handleDatabaseError(Object.assign(new Error('SQLITE_CONSTRAINT: UNIQUE failed'), { code: 'SQLITE_CONSTRAINT' }))).toThrow(DatabaseError);
    expect(() => handleDatabaseError(uniqueError)).toThrow(ConflictError);
    expect(() => handleDatabaseError(foreignKeyError)).toThrow(ValidationError);
    expect(() => handleDatabaseError(genericConstraint)).toThrow(ValidationError);
    expect(() => handleDatabaseError(busyError)).toThrow(DatabaseError);
    expect(() => handleDatabaseError(noRowsError, 'Branch', 9)).toThrow(NotFoundError);
  });

  it('formats express error responses', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { status, json } as unknown as Response;
    const req = {} as Request;
    const next = vi.fn() as unknown as NextFunction;

    errorHandler(new ValidationError('wrong payload'), req, res, next);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error: wrong payload',
      },
    });

    errorHandler(new Error('unexpected'), req, res, next);
    expect(status).toHaveBeenLastCalledWith(500);
    expect(json).toHaveBeenLastCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });
});
