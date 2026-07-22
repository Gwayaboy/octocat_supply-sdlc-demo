import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExistsSync, mockReaddirSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReaddirSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  },
}));

vi.mock('./sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from './sqlite';
import { MigrationRunner, runMigrations } from './migrate';

describe('MigrationRunner', () => {
  let mockDb: { run: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = { run: vi.fn(), all: vi.fn(), get: vi.fn() };
  });

  it('throws when migration dir is missing and validates filename format', () => {
    mockExistsSync.mockReturnValue(false);
    const runner = new MigrationRunner(mockDb as never, '/missing');
    expect(() => (runner as any).getMigrationFiles()).toThrow('Migrations directory not found');
    expect(() => (runner as any).extractVersionFromFilename('bad.sql')).toThrow(
      'Invalid migration filename format',
    );
  });

  it('runs pending migrations and records applied versions', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['001_init.sql', '002_more.sql', 'notes.txt']);
    mockReadFileSync
      .mockReturnValueOnce('CREATE TABLE t(a); INSERT INTO t VALUES (1);')
      .mockReturnValueOnce('CREATE TABLE u(b);');
    mockDb.all.mockResolvedValue([{ version: 1 }]);

    const runner = new MigrationRunner(mockDb as never, '/migrations');
    await runner.runMigrations();

    expect(mockDb.run).toHaveBeenCalled();
    expect(mockDb.run).toHaveBeenCalledWith('CREATE TABLE u(b)');
    expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO migrations (version, filename) VALUES (?, ?)', [
      2,
      '002_more.sql',
    ]);
  });

  it('handles no pending migrations and getCurrentVersion', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['001_init.sql']);
    mockReadFileSync.mockReturnValueOnce('CREATE TABLE t(a);');
    mockDb.all.mockResolvedValue([{ version: 1 }]);
    mockDb.get.mockResolvedValueOnce({ version: 1 }).mockResolvedValueOnce(undefined);

    const runner = new MigrationRunner(mockDb as never, '/migrations');
    await expect(runner.runMigrations()).resolves.toBeUndefined();
    await expect(runner.getCurrentVersion()).resolves.toBe(1);
    await expect(runner.getCurrentVersion()).resolves.toBe(0);
  });

  it('rethrows when applying migration fails', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['001_init.sql']);
    mockReadFileSync.mockReturnValueOnce('CREATE TABLE t(a);');
    mockDb.all.mockResolvedValue([]);
    mockDb.run.mockRejectedValueOnce(new Error('sql fail'));

    const runner = new MigrationRunner(mockDb as never, '/migrations');
    await expect(runner.runMigrations()).rejects.toThrow('sql fail');
  });

  it('runs exported runMigrations helper', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    mockDb.all.mockResolvedValue([]);
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    await expect(runMigrations(true)).resolves.toBeUndefined();
    expect(getDatabase).toHaveBeenCalledWith(true);
  });
});
