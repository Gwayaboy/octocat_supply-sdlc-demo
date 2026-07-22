import { describe, it, expect } from 'vitest';
import type { Delivery } from './delivery';

describe('Delivery model', () => {
  it('should create a valid delivery object', () => {
    const delivery: Delivery = {
      deliveryId: 1,
      supplierId: 2,
      deliveryDate: '2024-06-15',
      name: 'Summer Shipment',
      description: 'Quarterly bulk delivery',
      status: 'pending',
    };
    expect(delivery.deliveryId).toBe(1);
    expect(delivery.supplierId).toBe(2);
    expect(delivery.deliveryDate).toBe('2024-06-15');
    expect(delivery.name).toBe('Summer Shipment');
    expect(delivery.description).toBe('Quarterly bulk delivery');
    expect(delivery.status).toBe('pending');
  });

  it('should have numeric deliveryId and supplierId', () => {
    const delivery: Delivery = {
      deliveryId: 100,
      supplierId: 5,
      deliveryDate: '2024-01-01',
      name: 'New Year Delivery',
      description: '',
      status: 'delivered',
    };
    expect(typeof delivery.deliveryId).toBe('number');
    expect(typeof delivery.supplierId).toBe('number');
  });

  it('should support different status values', () => {
    const statuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
    statuses.forEach((status) => {
      const delivery: Delivery = {
        deliveryId: 1,
        supplierId: 1,
        deliveryDate: '2024-03-10',
        name: `${status} Delivery`,
        description: '',
        status,
      };
      expect(delivery.status).toBe(status);
    });
  });

  it('should support partial object spread for updates', () => {
    const original: Delivery = {
      deliveryId: 1,
      supplierId: 1,
      deliveryDate: '2024-04-01',
      name: 'Original Delivery',
      description: 'Original',
      status: 'pending',
    };
    const updated: Delivery = { ...original, status: 'delivered', name: 'Updated Delivery' };
    expect(updated.status).toBe('delivered');
    expect(updated.name).toBe('Updated Delivery');
    expect(updated.deliveryId).toBe(original.deliveryId);
  });
});
