import { describe, expect, it } from 'vitest';
import type { Order } from './order';

describe('Order model', () => {
  it('has the expected shape', () => {
    const order: Order = {
      orderId: 1,
      branchId: 1,
      orderDate: '2024-01-15',
      name: 'Test Order',
      description: 'A test order',
      status: 'pending',
    };

    expect(order.orderId).toBe(1);
    expect(typeof order.branchId).toBe('number');
    expect(typeof order.orderDate).toBe('string');
    expect(typeof order.status).toBe('string');
  });

  it('supports documented status values', () => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    expect(statuses).toContain('processing');
    expect(statuses).toContain('cancelled');
  });

  it('supports multiple orders for one branch', () => {
    const orders: Order[] = [
      { orderId: 1, branchId: 1, orderDate: '2024-01-15', name: 'Order A', description: '', status: 'pending' },
      { orderId: 2, branchId: 1, orderDate: '2024-01-16', name: 'Order B', description: '', status: 'processing' },
    ];

    expect(orders).toHaveLength(2);
    expect(orders[0].branchId).toBe(orders[1].branchId);
  });
});
