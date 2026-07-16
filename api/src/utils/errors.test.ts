import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
  ConflictError,
  handleDatabaseError,
  errorHandler,
} from './errors';

describe('DatabaseError', () => {
  it('creates error with message, code and statusCode', () => {
    const error = new DatabaseError('Test error', 'TEST_CODE', 400);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('DatabaseError');
  });

  it('uses defaults for code and statusCode', () => {
    const error = new DatabaseError('Test error');
    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.statusCode).toBe(500);
  });

  it('is an instance of Error', () => {
    const error = new DatabaseError('Test');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof DatabaseError).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('creates a 404 error with entity and id', () => {
    const error = new NotFoundError('Branch', 42);
    expect(error.message).toContain('Branch');
    expect(error.message).toContain('42');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.name).toBe('NotFoundError');
  });

  it('is an instance of DatabaseError', () => {
    const error = new NotFoundError('Supplier', 1);
    expect(error instanceof DatabaseError).toBe(true);
    expect(error instanceof NotFoundError).toBe(true);
  });
});

describe('ValidationError', () => {
  it('creates a 400 error with validation message', () => {
    const error = new ValidationError('Field is required');
    expect(error.message).toContain('Field is required');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });
});

describe('ConflictError', () => {
  it('creates a 409 error with conflict message', () => {
    const error = new ConflictError('Resource already exists');
    expect(error.message).toContain('Resource already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.name).toBe('ConflictError');
  });
});

describe('handleDatabaseError', () => {
  it('wraps non-DatabaseError Error in DatabaseError', () => {
    const raw = new Error('some sqlite error');
    expect(() => handleDatabaseError(raw)).toThrow(DatabaseError);
  });

  it('wraps unknown non-Error in DatabaseError', () => {
    expect(() => handleDatabaseError('string error')).toThrow(DatabaseError);
  });

  it('throws ConflictError for SQLITE_CONSTRAINT UNIQUE violation', () => {
    const dbErr = new DatabaseError('UNIQUE constraint failed: suppliers.name', 'SQLITE_CONSTRAINT', 500);
    expect(() => handleDatabaseError(dbErr)).toThrow(ConflictError);
  });

  it('throws ValidationError for SQLITE_CONSTRAINT FOREIGN KEY violation', () => {
    const dbErr = new DatabaseError('FOREIGN KEY constraint failed', 'SQLITE_CONSTRAINT', 500);
    expect(() => handleDatabaseError(dbErr)).toThrow(ValidationError);
  });

  it('throws ValidationError for generic SQLITE_CONSTRAINT violation', () => {
    const dbErr = new DatabaseError('CHECK constraint failed', 'SQLITE_CONSTRAINT', 500);
    expect(() => handleDatabaseError(dbErr)).toThrow(ValidationError);
  });

  it('throws DatabaseError for SQLITE_BUSY', () => {
    const dbErr = new DatabaseError('database is locked', 'SQLITE_BUSY', 500);
    expect(() => handleDatabaseError(dbErr)).toThrow(DatabaseError);
    try {
      handleDatabaseError(dbErr);
    } catch (e) {
      expect((e as DatabaseError).statusCode).toBe(503);
    }
  });

  it('re-throws other DatabaseError instances unchanged', () => {
    const original = new NotFoundError('Branch', 1);
    expect(() => handleDatabaseError(original)).toThrow(NotFoundError);
  });
});

describe('errorHandler middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/db-error', (_req, _res, next) => {
      next(new DatabaseError('DB failed', 'DB_ERR', 503));
    });
    app.get('/not-found', (_req, _res, next) => {
      next(new NotFoundError('Item', 99));
    });
    app.get('/generic-error', (_req, _res, next) => {
      next(new Error('unexpected'));
    });
    app.use(errorHandler);
  });

  it('returns structured JSON for DatabaseError', async () => {
    const res = await request(app).get('/db-error');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DB_ERR');
    expect(res.body.error.message).toContain('DB failed');
  });

  it('returns 404 JSON for NotFoundError', async () => {
    const res = await request(app).get('/not-found');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 500 JSON for generic non-DatabaseError', async () => {
    const res = await request(app).get('/generic-error');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('DatabaseError', () => {
  it('creates error with message, code and statusCode', () => {
    const error = new DatabaseError('Test error', 'TEST_CODE', 400);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('DatabaseError');
  });

  it('uses defaults for code and statusCode', () => {
    const error = new DatabaseError('Test error');
    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.statusCode).toBe(500);
  });

  it('is an instance of Error', () => {
    const error = new DatabaseError('Test');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof DatabaseError).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('creates a 404 error with entity and id', () => {
    const error = new NotFoundError('Branch', 42);
    expect(error.message).toContain('Branch');
    expect(error.message).toContain('42');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.name).toBe('NotFoundError');
  });

  it('is an instance of DatabaseError', () => {
    const error = new NotFoundError('Supplier', 1);
    expect(error instanceof DatabaseError).toBe(true);
    expect(error instanceof NotFoundError).toBe(true);
  });
});

describe('ValidationError', () => {
  it('creates a 400 error with validation message', () => {
    const error = new ValidationError('Field is required');
    expect(error.message).toContain('Field is required');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });
});

describe('ConflictError', () => {
  it('creates a 409 error with conflict message', () => {
    const error = new ConflictError('Resource already exists');
    expect(error.message).toContain('Resource already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.name).toBe('ConflictError');
  });
});

describe('handleDatabaseError', () => {
  it('re-throws DatabaseError instances', () => {
    const original = new NotFoundError('Branch', 1);
    expect(() => handleDatabaseError(original)).toThrow(NotFoundError);
  });

  it('wraps non-DatabaseError in DatabaseError', () => {
    const raw = new Error('some sqlite error');
    expect(() => handleDatabaseError(raw)).toThrow(DatabaseError);
  });

  it('wraps unknown errors in DatabaseError', () => {
    expect(() => handleDatabaseError('string error')).toThrow(DatabaseError);
  });
});
