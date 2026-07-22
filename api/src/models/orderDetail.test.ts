import { describe, it, expect } from 'vitest';
import type { OrderDetail } from './orderDetail';

describe('OrderDetail model', () => {
  it('should create a valid order detail object', () => {
    const orderDetail: OrderDetail = {
      orderDetailId: 1,
      orderId: 5,
      productId: 10,
      quantity: 20,
      unitPrice: 15.5,
      notes: 'Handle with care',
    };
    expect(orderDetail.orderDetailId).toBe(1);
    expect(orderDetail.orderId).toBe(5);
    expect(orderDetail.productId).toBe(10);
    expect(orderDetail.quantity).toBe(20);
    expect(orderDetail.unitPrice).toBe(15.5);
    expect(orderDetail.notes).toBe('Handle with care');
  });

  it('should have integer IDs and quantity', () => {
    const orderDetail: OrderDetail = {
      orderDetailId: 2,
      orderId: 3,
      productId: 7,
      quantity: 100,
      unitPrice: 9.99,
      notes: '',
    };
    expect(typeof orderDetail.orderDetailId).toBe('number');
    expect(typeof orderDetail.orderId).toBe('number');
    expect(typeof orderDetail.productId).toBe('number');
    expect(typeof orderDetail.quantity).toBe('number');
    expect(Number.isInteger(orderDetail.quantity)).toBe(true);
  });

  it('should support float unitPrice', () => {
    const orderDetail: OrderDetail = {
      orderDetailId: 3,
      orderId: 1,
      productId: 2,
      quantity: 10,
      unitPrice: 99.99,
      notes: '',
    };
    expect(orderDetail.unitPrice).toBe(99.99);
    expect(typeof orderDetail.unitPrice).toBe('number');
  });

  it('should support partial spread for updates', () => {
    const original: OrderDetail = {
      orderDetailId: 1,
      orderId: 1,
      productId: 1,
      quantity: 5,
      unitPrice: 10.0,
      notes: 'Original',
    };
    const updated: OrderDetail = { ...original, quantity: 15, notes: 'Updated' };
    expect(updated.quantity).toBe(15);
    expect(updated.notes).toBe('Updated');
    expect(updated.orderDetailId).toBe(original.orderDetailId);
    expect(updated.unitPrice).toBe(original.unitPrice);
  });
});
