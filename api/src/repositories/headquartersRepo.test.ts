import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HeadquartersRepository,
  createHeadquartersRepository,
  getHeadquartersRepository,
} from './headquartersRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('HeadquartersRepository', () => {
  let repository: HeadquartersRepository;
  let mockDb: { run: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { run: vi.fn(), get: vi.fn(), all: vi.fn() };
    repository = new HeadquartersRepository(mockDb as never);
    vi.clearAllMocks();
  });

  it('covers core CRUD and search behavior', async () => {
    mockDb.all.mockResolvedValueOnce([{ headquarters_id: 1, name: 'HQ' }]).mockResolvedValueOnce([{ headquarters_id: 2, name: 'A' }]);
    await expect(repository.findAll()).resolves.toEqual([{ headquartersId: 1, name: 'HQ' }]);

    mockDb.get.mockResolvedValueOnce({ headquarters_id: 1, name: 'HQ' }).mockResolvedValueOnce(undefined);
    await expect(repository.findById(1)).resolves.toEqual({ headquartersId: 1, name: 'HQ' });
    await expect(repository.findById(2)).resolves.toBeNull();

    mockDb.run.mockResolvedValueOnce({ lastID: 5, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ headquarters_id: 5, name: 'Created' });
    await expect(repository.create({ name: 'Created' } as never)).resolves.toEqual({ headquartersId: 5, name: 'Created' });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ headquarters_id: 5, name: 'Updated' });
    await expect(repository.update(5, { name: 'Updated' })).resolves.toEqual({ headquartersId: 5, name: 'Updated' });

    mockDb.get.mockResolvedValueOnce({ count: 1 });
    await expect(repository.exists(5)).resolves.toBe(true);
    await expect(repository.findByName('A')).resolves.toEqual([{ headquartersId: 2, name: 'A' }]);
  });

  it('throws for not found update/delete and wraps unknown errors', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(9, { name: 'X' })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(9)).rejects.toThrow(NotFoundError);

    mockDb.get.mockRejectedValue(new Error('db failed'));
    await expect(repository.findById(1)).rejects.toThrow(DatabaseError);
  });

  it('covers factory/getter', async () => {
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);
    expect(await createHeadquartersRepository(true)).toBeInstanceOf(HeadquartersRepository);
    expect(await getHeadquartersRepository(true)).toBeInstanceOf(HeadquartersRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getHeadquartersRepository(false);
    const repoB = await getHeadquartersRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
