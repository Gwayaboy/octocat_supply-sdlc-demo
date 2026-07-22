import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockMkdirSync, mockExistsSync, mockDbInstance, mockDatabaseCtor } = vi.hoisted(() => {
  const db = {
    prepare: vi.fn(),
    pragma: vi.fn(),
    close: vi.fn(),
  };
  return {
    mockMkdirSync: vi.fn(),
    mockExistsSync: vi.fn(),
    mockDbInstance: db,
    mockDatabaseCtor: vi.fn(() => db),
  };
});

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
  },
}));

vi.mock('better-sqlite3', () => ({
  default: function MockDatabase(...args: unknown[]) {
    return mockDatabaseCtor(...args);
  },
}));

import { DatabaseConnection, SQLiteHelper, closeDatabase, getDatabase } from './sqlite';

describe('sqlite utils', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockDbInstance.prepare.mockReset();
    mockDbInstance.pragma.mockReset();
    mockDbInstance.close.mockReset();
    await closeDatabase();
  });

  it('DatabaseConnection run/get/all/close work', async () => {
    const run = vi.fn().mockReturnValue({ lastInsertRowid: 3, changes: 1 });
    const get = vi.fn().mockReturnValue({ id: 1 });
    const all = vi.fn().mockReturnValue([{ id: 1 }]);
    mockDbInstance.prepare.mockImplementation((sql: string) => {
      if (sql === 'RUN') return { run };
      if (sql === 'GET') return { get };
      return { all };
    });

    const conn = new DatabaseConnection(mockDbInstance as never);
    await expect(conn.run('RUN', ['x'])).resolves.toEqual({ lastID: 3, changes: 1 });
    await expect(conn.get('GET', [1])).resolves.toEqual({ id: 1 });
    await expect(conn.all('ALL')).resolves.toEqual([{ id: 1 }]);
    await expect(conn.close()).resolves.toBeUndefined();
    expect(mockDbInstance.close).toHaveBeenCalled();
  });

  it('converts bigint lastInsertRowid and guards safe range', async () => {
    const conn = new DatabaseConnection({
      ...mockDbInstance,
      prepare: vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ lastInsertRowid: BigInt(42), changes: 1 }),
      }),
    } as never);
    await expect(conn.run('INSERT')).resolves.toEqual({ lastID: 42, changes: 1 });

    const overflowConn = new DatabaseConnection({
      ...mockDbInstance,
      prepare: vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ lastInsertRowid: BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), changes: 1 }),
      }),
    } as never);
    expect(() => overflowConn.run('INSERT')).toThrow('exceeds safe integer range');
  });

  it('connects database, configures pragmas, and reuses global connection', async () => {
    const helper = SQLiteHelper.getInstance();
    mockExistsSync.mockReturnValue(false);
    const conn = await helper.connect(false);
    expect(conn).toBeInstanceOf(DatabaseConnection);
    expect(mockMkdirSync).toHaveBeenCalled();
    expect(mockDbInstance.pragma).toHaveBeenCalledWith('foreign_keys = ON');
    expect(mockDbInstance.pragma).toHaveBeenCalledWith('journal_mode = WAL');

    const cachedA = await getDatabase(false);
    const cachedB = await getDatabase(false);
    expect(cachedA).toBe(cachedB);
  });

  it('handles connection/setup/close failures', async () => {
    mockDatabaseCtor.mockImplementationOnce(() => {
      throw new Error('ctor failed');
    });
    const helper = SQLiteHelper.getInstance();
    await expect(helper.connect(false)).rejects.toThrow('Failed to connect to database');

    mockDatabaseCtor.mockImplementationOnce(() => ({
      ...mockDbInstance,
      pragma: vi.fn(() => {
        throw new Error('pragma fail');
      }),
    }));
    await expect(helper.connect(false)).rejects.toThrow('Failed to enable foreign key constraints');

    const closeFailHelper = SQLiteHelper.getInstance();
    mockDatabaseCtor.mockImplementationOnce(() => ({
      ...mockDbInstance,
      close: vi.fn(() => {
        throw new Error('close fail');
      }),
    }));
    await closeFailHelper.connect(false);
    await expect(closeFailHelper.close()).rejects.toThrow('Failed to close database');
  });
});
