import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { MigrationRunner, runMigrations } from './migrate';
import { closeDatabase, getDatabase } from './sqlite';

describe('MigrationRunner', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('runs all pending migrations successfully', async () => {
    const db = await getDatabase();
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.runMigrations();

    const version = await runner.getCurrentVersion();
    expect(version).toBeGreaterThan(0);
  });

  it('returns 0 version before any migrations are applied', async () => {
    const db = await getDatabase();
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    const version = await runner.getCurrentVersion();
    expect(version).toBe(0);
  });

  it('reports correct version after migrations', async () => {
    const db = await getDatabase();
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.runMigrations();

    const version = await runner.getCurrentVersion();
    expect(typeof version).toBe('number');
    expect(version).toBeGreaterThanOrEqual(1);
  });

  it('skips already applied migrations (no pending)', async () => {
    const db = await getDatabase();
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const runner = new MigrationRunner(db, migrationsDir);

    await runner.runMigrations();
    const versionAfterFirst = await runner.getCurrentVersion();

    // Running again should be a no-op
    await runner.runMigrations();
    const versionAfterSecond = await runner.getCurrentVersion();

    expect(versionAfterFirst).toBe(versionAfterSecond);
  });
});

describe('runMigrations helper', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('applies migrations using the global connection', async () => {
    await runMigrations(true);
    const db = await getDatabase();
    // Verify table exists after migration
    const result = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='branches'",
    );
    expect(result?.count).toBe(1);
  });

  it('is idempotent when run multiple times', async () => {
    await runMigrations(true);
    await runMigrations(true);
    const db = await getDatabase();
    const result = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='suppliers'",
    );
    expect(result?.count).toBe(1);
  });
});
