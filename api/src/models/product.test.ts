import { describe, expect, it } from 'vitest';
import type { Product } from './product';

describe('Product model', () => {
  it('has the expected shape', () => {
    const product: Product = {
      productId: 1,
      supplierId: 1,
      name: 'Test Product',
      description: 'A product for testing',
      price: 29.99,
      sku: 'SKU-001',
      unit: 'piece',
      imgName: 'test.jpg',
    };

    expect(product.productId).toBe(1);
    expect(typeof product.price).toBe('number');
    expect(typeof product.sku).toBe('string');
  });

  it('allows discount to be optional', () => {
    const product: Product = {
      productId: 2,
      supplierId: 1,
      name: 'Discounted Product',
      description: '',
      price: 10,
      sku: 'SKU-002',
      unit: 'piece',
      imgName: 'discount.jpg',
    };

    expect(product.discount).toBeUndefined();
  });

  it('supports an explicit discount value', () => {
    const product: Product = {
      productId: 3,
      supplierId: 1,
      name: 'Sale Product',
      description: '',
      price: 20,
      sku: 'SKU-003',
      unit: 'box',
      imgName: 'sale.jpg',
      discount: 0.25,
    };

    expect(product.discount).toBe(0.25);
  });
});
