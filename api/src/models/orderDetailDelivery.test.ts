import { describe, it, expect } from 'vitest';
import type { OrderDetailDelivery } from './orderDetailDelivery';

describe('OrderDetailDelivery model', () => {
  it('should create a valid order detail delivery object', () => {
    const odd: OrderDetailDelivery = {
      orderDetailDeliveryId: 1,
      orderDetailId: 4,
      deliveryId: 7,
      quantity: 10,
      notes: 'Partial shipment',
    };
    expect(odd.orderDetailDeliveryId).toBe(1);
    expect(odd.orderDetailId).toBe(4);
    expect(odd.deliveryId).toBe(7);
    expect(odd.quantity).toBe(10);
    expect(odd.notes).toBe('Partial shipment');
  });

  it('should have integer IDs and quantity', () => {
    const odd: OrderDetailDelivery = {
      orderDetailDeliveryId: 2,
      orderDetailId: 5,
      deliveryId: 8,
      quantity: 50,
      notes: '',
    };
    expect(typeof odd.orderDetailDeliveryId).toBe('number');
    expect(typeof odd.orderDetailId).toBe('number');
    expect(typeof odd.deliveryId).toBe('number');
    expect(typeof odd.quantity).toBe('number');
    expect(Number.isInteger(odd.quantity)).toBe(true);
  });

  it('should allow empty notes string', () => {
    const odd: OrderDetailDelivery = {
      orderDetailDeliveryId: 3,
      orderDetailId: 1,
      deliveryId: 2,
      quantity: 5,
      notes: '',
    };
    expect(odd.notes).toBe('');
    expect(typeof odd.notes).toBe('string');
  });

  it('should support partial spread for updates', () => {
    const original: OrderDetailDelivery = {
      orderDetailDeliveryId: 1,
      orderDetailId: 1,
      deliveryId: 1,
      quantity: 3,
      notes: 'Original batch',
    };
    const updated: OrderDetailDelivery = { ...original, quantity: 8, notes: 'Updated batch' };
    expect(updated.quantity).toBe(8);
    expect(updated.notes).toBe('Updated batch');
    expect(updated.orderDetailDeliveryId).toBe(original.orderDetailDeliveryId);
    expect(updated.deliveryId).toBe(original.deliveryId);
  });
});
