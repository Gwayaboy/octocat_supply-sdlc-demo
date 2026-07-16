import { describe, expect, it } from 'vitest';
import type { OrderDetailDelivery } from './orderDetailDelivery';

describe('OrderDetailDelivery model', () => {
  it('has the expected shape', () => {
    const orderDetailDelivery: OrderDetailDelivery = {
      orderDetailDeliveryId: 1,
      orderDetailId: 1,
      deliveryId: 1,
      quantity: 3,
      notes: 'Partial shipment',
    };

    expect(orderDetailDelivery.orderDetailDeliveryId).toBe(1);
    expect(typeof orderDetailDelivery.orderDetailId).toBe('number');
    expect(typeof orderDetailDelivery.deliveryId).toBe('number');
  });

  it('tracks delivered quantities', () => {
    const orderDetailDelivery: OrderDetailDelivery = {
      orderDetailDeliveryId: 2,
      orderDetailId: 1,
      deliveryId: 2,
      quantity: 4,
      notes: '',
    };

    expect(orderDetailDelivery.quantity).toBeGreaterThan(0);
  });

  it('supports multiple delivery links for one order detail', () => {
    const links: OrderDetailDelivery[] = [
      { orderDetailDeliveryId: 1, orderDetailId: 1, deliveryId: 1, quantity: 2, notes: '' },
      { orderDetailDeliveryId: 2, orderDetailId: 1, deliveryId: 2, quantity: 1, notes: '' },
    ];

    expect(links[0].orderDetailId).toBe(links[1].orderDetailId);
    expect(links[0].deliveryId).not.toBe(links[1].deliveryId);
  });
});
