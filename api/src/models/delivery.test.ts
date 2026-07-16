import { describe, expect, it } from 'vitest';
import type { Delivery } from './delivery';

describe('Delivery model', () => {
  it('has the expected shape', () => {
    const delivery: Delivery = {
      deliveryId: 1,
      supplierId: 1,
      deliveryDate: '2024-01-15',
      name: 'Test Delivery',
      description: 'Scheduled delivery',
      status: 'pending',
    };

    expect(delivery.deliveryId).toBe(1);
    expect(typeof delivery.supplierId).toBe('number');
    expect(typeof delivery.deliveryDate).toBe('string');
    expect(typeof delivery.status).toBe('string');
  });

  it('supports common delivery statuses', () => {
    const statuses = ['pending', 'shipped', 'delivered'];

    expect(statuses).toContain('pending');
    expect(statuses).toContain('delivered');
  });

  it('allows multiple deliveries for one supplier', () => {
    const deliveries: Delivery[] = [
      { deliveryId: 1, supplierId: 1, deliveryDate: '2024-01-15', name: 'Delivery A', description: '', status: 'pending' },
      { deliveryId: 2, supplierId: 1, deliveryDate: '2024-01-16', name: 'Delivery B', description: '', status: 'delivered' },
    ];

    expect(deliveries[0].supplierId).toBe(deliveries[1].supplierId);
    expect(deliveries[0].deliveryId).not.toBe(deliveries[1].deliveryId);
  });
});
