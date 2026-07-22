import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersRepository, createOrdersRepository, getOrdersRepository } from './ordersRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('OrdersRepository', () => {
  let repository: OrdersRepository;
  let mockDb: { run: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { run: vi.fn(), get: vi.fn(), all: vi.fn() };
    repository = new OrdersRepository(mockDb as never);
    vi.clearAllMocks();
  });

  it('covers CRUD and custom finders', async () => {
    mockDb.all
      .mockResolvedValueOnce([{ order_id: 1, branch_id: 2, status: 'pending' }])
      .mockResolvedValueOnce([{ order_id: 2, branch_id: 2 }])
      .mockResolvedValueOnce([{ order_id: 3, status: 'shipped' }])
      .mockResolvedValueOnce([{ order_id: 4, order_date: '2026-01-01' }]);
    await expect(repository.findAll()).resolves.toEqual([{ orderId: 1, branchId: 2, status: 'pending' }]);

    mockDb.get.mockResolvedValueOnce({ order_id: 1, branch_id: 2 }).mockResolvedValueOnce(undefined);
    await expect(repository.findById(1)).resolves.toEqual({ orderId: 1, branchId: 2 });
    await expect(repository.findById(8)).resolves.toBeNull();

    mockDb.run.mockResolvedValueOnce({ lastID: 7, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ order_id: 7, status: 'pending' });
    await expect(repository.create({ status: 'pending' } as never)).resolves.toEqual({ orderId: 7, status: 'pending' });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ order_id: 7, status: 'done' });
    await expect(repository.update(7, { status: 'done' })).resolves.toEqual({ orderId: 7, status: 'done' });

    mockDb.get.mockResolvedValueOnce({ count: 1 });
    await expect(repository.exists(7)).resolves.toBe(true);
    await expect(repository.findByBranchId(2)).resolves.toEqual([{ orderId: 2, branchId: 2 }]);
    await expect(repository.findByStatus('shipped')).resolves.toEqual([{ orderId: 3, status: 'shipped' }]);
    await expect(repository.findByDateRange('2026-01-01', '2026-12-31')).resolves.toEqual([{ orderId: 4, orderDate: '2026-01-01' }]);
  });

  it('throws on not found and db errors', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(404, { status: 'x' })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(404)).rejects.toThrow(NotFoundError);

    mockDb.get.mockRejectedValue(new Error('broken'));
    await expect(repository.exists(1)).rejects.toThrow(DatabaseError);
  });

  it('covers factory/getter', async () => {
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);
    expect(await createOrdersRepository(true)).toBeInstanceOf(OrdersRepository);
    expect(await getOrdersRepository(true)).toBeInstanceOf(OrdersRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getOrdersRepository(false);
    const repoB = await getOrdersRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
