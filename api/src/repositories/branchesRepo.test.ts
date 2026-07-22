import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchesRepository, createBranchesRepository, getBranchesRepository } from './branchesRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('BranchesRepository', () => {
  let repository: BranchesRepository;
  let mockDb: {
    run: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDb = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    };
    repository = new BranchesRepository(mockDb as never);
    vi.clearAllMocks();
    process.env.NODE_ENV = '';
    process.env.VITEST = '';
  });

  it('finds all and maps rows', async () => {
    mockDb.all.mockResolvedValue([{ branch_id: 1, name: 'North' }]);
    await expect(repository.findAll()).resolves.toEqual([{ branchId: 1, name: 'North' }]);
  });

  it('finds by id and returns null when missing', async () => {
    mockDb.get.mockResolvedValueOnce({ branch_id: 2, name: 'South' });
    await expect(repository.findById(2)).resolves.toEqual({ branchId: 2, name: 'South' });
    mockDb.get.mockResolvedValueOnce(undefined);
    await expect(repository.findById(3)).resolves.toBeNull();
  });

  it('creates and updates branches', async () => {
    mockDb.run.mockResolvedValueOnce({ lastID: 10, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ branch_id: 10, name: 'New' });
    await expect(repository.create({ name: 'New' } as never)).resolves.toEqual({ branchId: 10, name: 'New' });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ branch_id: 10, name: 'Updated' });
    await expect(repository.update(10, { name: 'Updated' })).resolves.toEqual({ branchId: 10, name: 'Updated' });
  });

  it('throws for update/delete not found and supports exists/finders', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(999, { name: 'X' })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(999)).rejects.toThrow(NotFoundError);

    mockDb.get.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(2)).resolves.toBe(false);

    mockDb.all.mockResolvedValueOnce([{ branch_id: 4, headquarters_id: 2 }]).mockResolvedValueOnce([{ branch_id: 5, name: 'Main' }]);
    await expect(repository.findByHeadquartersId(2)).resolves.toEqual([{ branchId: 4, headquartersId: 2 }]);
    await expect(repository.findByName('Main')).resolves.toEqual([{ branchId: 5, name: 'Main' }]);
  });

  it('wraps unknown db errors', async () => {
    mockDb.all.mockRejectedValue(new Error('boom'));
    await expect(repository.findAll()).rejects.toThrow(DatabaseError);
  });

  it('creates repositories from factory/getter', async () => {
    (getDatabase as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const fromFactory = await createBranchesRepository(true);
    expect(fromFactory).toBeInstanceOf(BranchesRepository);
    expect(getDatabase).toHaveBeenCalledWith(true);

    const testRepoA = await getBranchesRepository(true);
    const testRepoB = await getBranchesRepository(true);
    expect(testRepoA).toBeInstanceOf(BranchesRepository);
    expect(testRepoB).toBeInstanceOf(BranchesRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getBranchesRepository(false);
    const repoB = await getBranchesRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
