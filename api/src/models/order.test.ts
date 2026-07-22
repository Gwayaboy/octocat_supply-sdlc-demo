import { describe, it, expect } from 'vitest';
import type { Order } from './order';

describe('Order model', () => {
  it('should create a valid order object', () => {
    const order: Order = {
      orderId: 1,
      branchId: 3,
      orderDate: '2024-05-20T09:00:00Z',
      name: 'Bulk Office Supplies',
      description: 'Monthly office supply order',
      status: 'pending',
    };
    expect(order.orderId).toBe(1);
    expect(order.branchId).toBe(3);
    expect(order.orderDate).toBe('2024-05-20T09:00:00Z');
    expect(order.name).toBe('Bulk Office Supplies');
    expect(order.description).toBe('Monthly office supply order');
    expect(order.status).toBe('pending');
  });

  it('should have numeric orderId and branchId', () => {
    const order: Order = {
      orderId: 10,
      branchId: 5,
      orderDate: '2024-06-01',
      name: 'Test Order',
      description: '',
      status: 'pending',
    };
    expect(typeof order.orderId).toBe('number');
    expect(typeof order.branchId).toBe('number');
    expect(Number.isInteger(order.orderId)).toBe(true);
    expect(Number.isInteger(order.branchId)).toBe(true);
  });

  it('should support the defined status enum values', () => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    statuses.forEach((status) => {
      const order: Order = {
        orderId: 1,
        branchId: 1,
        orderDate: '2024-07-01',
        name: `${status} Order`,
        description: '',
        status,
      };
      expect(order.status).toBe(status);
    });
  });

  it('should support partial spread for updates', () => {
    const original: Order = {
      orderId: 1,
      branchId: 1,
      orderDate: '2024-08-01',
      name: 'Original Order',
      description: 'Original',
      status: 'pending',
    };
    const updated: Order = { ...original, status: 'shipped', name: 'Updated Order' };
    expect(updated.status).toBe('shipped');
    expect(updated.name).toBe('Updated Order');
    expect(updated.orderId).toBe(original.orderId);
    expect(updated.branchId).toBe(original.branchId);
  });
});
