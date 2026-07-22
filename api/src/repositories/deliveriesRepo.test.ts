import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeliveriesRepository, createDeliveriesRepository, getDeliveriesRepository } from './deliveriesRepo';
import { DatabaseError, NotFoundError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('DeliveriesRepository', () => {
  let repository: DeliveriesRepository;
  let mockDb: { run: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; all: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockDb = { run: vi.fn(), get: vi.fn(), all: vi.fn() };
    repository = new DeliveriesRepository(mockDb as never);
    vi.clearAllMocks();
  });

  it('covers CRUD and search methods', async () => {
    mockDb.all
      .mockResolvedValueOnce([{ delivery_id: 1, supplier_id: 2, status: 'scheduled' }])
      .mockResolvedValueOnce([{ delivery_id: 2, supplier_id: 2 }])
      .mockResolvedValueOnce([{ delivery_id: 3, status: 'delivered' }])
      .mockResolvedValueOnce([{ delivery_id: 4, delivery_date: '2026-03-03' }]);
    await expect(repository.findAll()).resolves.toEqual([{ deliveryId: 1, supplierId: 2, status: 'scheduled' }]);

    mockDb.get.mockResolvedValueOnce({ delivery_id: 1, supplier_id: 2 }).mockResolvedValueOnce(undefined);
    await expect(repository.findById(1)).resolves.toEqual({ deliveryId: 1, supplierId: 2 });
    await expect(repository.findById(99)).resolves.toBeNull();

    mockDb.run.mockResolvedValueOnce({ lastID: 10, changes: 1 });
    mockDb.get.mockResolvedValueOnce({ delivery_id: 10, status: 'scheduled' });
    await expect(repository.create({ status: 'scheduled' } as never)).resolves.toEqual({ deliveryId: 10, status: 'scheduled' });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ delivery_id: 10, status: 'in_transit' });
    await expect(repository.update(10, { status: 'in_transit' })).resolves.toEqual({ deliveryId: 10, status: 'in_transit' });

    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({ delivery_id: 10, status: 'done' });
    await expect(repository.updateStatus(10, 'done')).resolves.toEqual({ deliveryId: 10, status: 'done' });

    mockDb.get.mockResolvedValueOnce({ count: 1 });
    await expect(repository.exists(10)).resolves.toBe(true);
    await expect(repository.findBySupplierId(2)).resolves.toEqual([{ deliveryId: 2, supplierId: 2 }]);
    await expect(repository.findByStatus('delivered')).resolves.toEqual([{ deliveryId: 3, status: 'delivered' }]);
    await expect(repository.findByDateRange('2026-01-01', '2026-12-31')).resolves.toEqual([{ deliveryId: 4, deliveryDate: '2026-03-03' }]);
  });

  it('throws on not found and db failures', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });
    await expect(repository.update(404, { status: 'x' })).rejects.toThrow(NotFoundError);
    await expect(repository.delete(404)).rejects.toThrow(NotFoundError);

    mockDb.all.mockRejectedValue(new Error('broken'));
    await expect(repository.findByStatus('x')).rejects.toThrow(DatabaseError);
  });

  it('covers factory/getter', async () => {
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);
    expect(await createDeliveriesRepository(true)).toBeInstanceOf(DeliveriesRepository);
    expect(await getDeliveriesRepository(true)).toBeInstanceOf(DeliveriesRepository);
  });

  it('reuses singleton outside test environment', async () => {
    const prevNode = process.env.NODE_ENV;
    const prevVitest = process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    vi.mocked(getDatabase).mockResolvedValue(mockDb as never);

    const repoA = await getDeliveriesRepository(false);
    const repoB = await getDeliveriesRepository(false);
    expect(repoA).toBe(repoB);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = prevNode;
    process.env.VITEST = prevVitest;
  });
});
