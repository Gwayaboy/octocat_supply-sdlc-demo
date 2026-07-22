import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OrderDetailDeliveriesRepository,
  createOrderDetailDeliveriesRepository,
  getOrderDetailDeliveriesRepository,
} from './orderDetailDeliveriesRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('OrderDetailDeliveriesRepository', () => {
  let repository: OrderDetailDeliveriesRepository;
  let mockDb: { run: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { run: vi.fn(), get: vi.fn(), all: vi.fn() };
    repository = new OrderDetailDeliveriesRepository(mockDb as never);
    vi.clearAllMocks();
  });

  it('covers CRUD and aggregate/finder methods', async () => {
    mockDb.all
      .mockResolvedValueOnce([{ order_detail_delivery_id: 1, order_detail_id: 2, delivery_id: 3 }])
      .mockResolvedValueOnce([{ order_detail_delivery_id: 2, order_detail_id: 2 }])
      .mockResolvedValueOnce([{ order_detail_delivery_id: 3, delivery_id: 3 }]);
    await expect(repository.findAll()).resolves.toEqual([
      { orderDetailDeliveryId: 1, orderDetailId: 2, deliveryId: 3 },
    ]);

    mockDb.get
      .mockResolvedValueOnce({ order_detail_delivery_id: 1, order_detail_id: 2 })
      .mockResolvedValueOnce(undefined);
    await expect(repository.findById(1)).resolves.toEqual({ orderDetailDeliveryId: 1, orderDetailId: 2 });
    await expect(repository.findById(404)).resolves.toBeNull();

    mockDb.run.mockResolvedValueOnce({ lastID: 7, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ order_detail_delivery_id: 7, quantity: 2 });
    await expect(repository.create({ quantity: 2 } as never)).resolves.toEqual({ orderDetailDeliveryId: 7, quantity: 2 });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ order_detail_delivery_id: 7, quantity: 4 });
    await expect(repository.update(7, { quantity: 4 })).resolves.toEqual({ orderDetailDeliveryId: 7, quantity: 4 });

    mockDb.get.mockResolvedValueOnce({ count: 1 });
    await expect(repository.exists(7)).resolves.toBe(true);
    await expect(repository.findByOrderDetailId(2)).resolves.toEqual([{ orderDetailDeliveryId: 2, orderDetailId: 2 }]);
    await expect(repository.findByDeliveryId(3)).resolves.toEqual([{ orderDetailDeliveryId: 3, deliveryId: 3 }]);
    mockDb.get.mockResolvedValueOnce({ total: 9 });
    await expect(repository.getTotalQuantityByOrderDetailId(2)).resolves.toBe(9);
  });

  it('throws on not found and db failures', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(404, { quantity: 1 })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(404)).rejects.toThrow(NotFoundError);

    mockDb.all.mockRejectedValue(new Error('bad db'));
    await expect(repository.findByDeliveryId(1)).rejects.toThrow(DatabaseError);
  });

  it('covers factory/getter', async () => {
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);
    expect(await createOrderDetailDeliveriesRepository(true)).toBeInstanceOf(OrderDetailDeliveriesRepository);
    expect(await getOrderDetailDeliveriesRepository(true)).toBeInstanceOf(OrderDetailDeliveriesRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getOrderDetailDeliveriesRepository(false);
    const repoB = await getOrderDetailDeliveriesRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
