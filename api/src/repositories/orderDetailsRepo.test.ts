import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OrderDetailsRepository,
  createOrderDetailsRepository,
  getOrderDetailsRepository,
} from './orderDetailsRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('OrderDetailsRepository', () => {
  let repository: OrderDetailsRepository;
  let mockDb: { run: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { run: vi.fn(), get: vi.fn(), all: vi.fn() };
    repository = new OrderDetailsRepository(mockDb as never);
    vi.clearAllMocks();
  });

  it('covers CRUD and finder/total methods', async () => {
    mockDb.all
      .mockResolvedValueOnce([{ order_detail_id: 1, order_id: 2, product_id: 3 }])
      .mockResolvedValueOnce([{ order_detail_id: 2, order_id: 2 }])
      .mockResolvedValueOnce([{ order_detail_id: 3, product_id: 3 }]);
    await expect(repository.findAll()).resolves.toEqual([{ orderDetailId: 1, orderId: 2, productId: 3 }]);

    mockDb.get
      .mockResolvedValueOnce({ order_detail_id: 1, order_id: 2 })
      .mockResolvedValueOnce(undefined);
    await expect(repository.findById(1)).resolves.toEqual({ orderDetailId: 1, orderId: 2 });
    await expect(repository.findById(999)).resolves.toBeNull();

    mockDb.run.mockResolvedValueOnce({ lastID: 7, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ order_detail_id: 7, quantity: 5 });
    await expect(repository.create({ quantity: 5 } as never)).resolves.toEqual({ orderDetailId: 7, quantity: 5 });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ order_detail_id: 7, quantity: 6 });
    await expect(repository.update(7, { quantity: 6 })).resolves.toEqual({ orderDetailId: 7, quantity: 6 });

    mockDb.get.mockResolvedValueOnce({ count: 1 });
    await expect(repository.exists(7)).resolves.toBe(true);
    await expect(repository.findByOrderId(2)).resolves.toEqual([{ orderDetailId: 2, orderId: 2 }]);
    await expect(repository.findByProductId(3)).resolves.toEqual([{ orderDetailId: 3, productId: 3 }]);
    mockDb.get.mockResolvedValueOnce({ total: 500 });
    await expect(repository.getTotalValueByOrderId(2)).resolves.toBe(500);
  });

  it('throws on not found and db failures', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(404, { quantity: 1 })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(404)).rejects.toThrow(NotFoundError);

    mockDb.get.mockRejectedValue(new Error('bad db'));
    await expect(repository.getTotalValueByOrderId(1)).rejects.toThrow(DatabaseError);
  });

  it('covers factory/getter', async () => {
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);
    expect(await createOrderDetailsRepository(true)).toBeInstanceOf(OrderDetailsRepository);
    expect(await getOrderDetailsRepository(true)).toBeInstanceOf(OrderDetailsRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getOrderDetailsRepository(false);
    const repoB = await getOrderDetailsRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
