import { describe, expect, it } from 'vitest';
import type { OrderDetail } from './orderDetail';

describe('OrderDetail model', () => {
  it('has the expected shape', () => {
    const orderDetail: OrderDetail = {
      orderDetailId: 1,
      orderId: 1,
      productId: 1,
      quantity: 5,
      unitPrice: 10.99,
      notes: 'Test notes',
    };

    expect(orderDetail.orderDetailId).toBe(1);
    expect(typeof orderDetail.quantity).toBe('number');
    expect(typeof orderDetail.unitPrice).toBe('number');
  });

  it('supports calculating a line total', () => {
    const orderDetail: OrderDetail = {
      orderDetailId: 2,
      orderId: 1,
      productId: 1,
      quantity: 3,
      unitPrice: 4.5,
      notes: '',
    };

    expect(orderDetail.quantity * orderDetail.unitPrice).toBe(13.5);
  });

  it('supports multiple order detail rows', () => {
    const details: OrderDetail[] = [
      { orderDetailId: 1, orderId: 1, productId: 1, quantity: 1, unitPrice: 1.5, notes: '' },
      { orderDetailId: 2, orderId: 1, productId: 2, quantity: 2, unitPrice: 2.5, notes: '' },
    ];

    expect(details[0].orderId).toBe(details[1].orderId);
    expect(details[0].productId).not.toBe(details[1].productId);
  });
});
