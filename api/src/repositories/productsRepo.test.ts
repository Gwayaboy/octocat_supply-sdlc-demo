import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsRepository, createProductsRepository, getProductsRepository } from './productsRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('ProductsRepository', () => {
  let repository: ProductsRepository;
  let mockDb: { run: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { run: vi.fn(), get: vi.fn(), all: vi.fn() };
    repository = new ProductsRepository(mockDb as never);
    vi.clearAllMocks();
  });

  it('covers CRUD/exists/finders', async () => {
    mockDb.all
      .mockResolvedValueOnce([{ product_id: 1, supplier_id: 2, name: 'Widget' }])
      .mockResolvedValueOnce([{ product_id: 1, supplier_id: 2, name: 'Widget' }])
      .mockResolvedValueOnce([{ product_id: 1, name: 'Widget' }]);
    await expect(repository.findAll()).resolves.toEqual([{ productId: 1, supplierId: 2, name: 'Widget' }]);

    mockDb.get.mockResolvedValueOnce({ product_id: 1, supplier_id: 2, name: 'Widget' }).mockResolvedValueOnce(undefined);
    await expect(repository.findById(1)).resolves.toEqual({ productId: 1, supplierId: 2, name: 'Widget' });
    await expect(repository.findById(9)).resolves.toBeNull();

    mockDb.run.mockResolvedValueOnce({ lastID: 3, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ product_id: 3, name: 'Created' });
    await expect(repository.create({ name: 'Created' } as never)).resolves.toEqual({ productId: 3, name: 'Created' });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ product_id: 3, name: 'Updated' });
    await expect(repository.update(3, { name: 'Updated' })).resolves.toEqual({ productId: 3, name: 'Updated' });

    mockDb.get.mockResolvedValueOnce({ count: 1 });
    await expect(repository.exists(3)).resolves.toBe(true);
    await expect(repository.findBySupplierId(2)).resolves.toEqual([{ productId: 1, supplierId: 2, name: 'Widget' }]);
    await expect(repository.findByName('Wid')).resolves.toEqual([{ productId: 1, name: 'Widget' }]);
  });

  it('throws on not found and db failures', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(99, { name: 'X' })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(99)).rejects.toThrow(NotFoundError);

    mockDb.all.mockRejectedValue(new Error('db fail'));
    await expect(repository.findByName('x')).rejects.toThrow(DatabaseError);
  });

  it('covers factory/getter', async () => {
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);
    expect(await createProductsRepository(true)).toBeInstanceOf(ProductsRepository);
    expect(await getProductsRepository(true)).toBeInstanceOf(ProductsRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getProductsRepository(false);
    const repoB = await getProductsRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
