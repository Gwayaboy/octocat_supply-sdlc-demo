import { describe, it, expect } from 'vitest';
import type { Product } from './product';

describe('Product model', () => {
  it('should create a valid product object with all fields', () => {
    const product: Product = {
      productId: 1,
      supplierId: 2,
      name: 'Office Chair',
      description: 'Ergonomic office chair with lumbar support',
      price: 299.99,
      sku: 'CHR-001',
      unit: 'piece',
      imgName: 'office-chair.jpg',
      discount: 0.1,
    };
    expect(product.productId).toBe(1);
    expect(product.supplierId).toBe(2);
    expect(product.name).toBe('Office Chair');
    expect(product.description).toBe('Ergonomic office chair with lumbar support');
    expect(product.price).toBe(299.99);
    expect(product.sku).toBe('CHR-001');
    expect(product.unit).toBe('piece');
    expect(product.imgName).toBe('office-chair.jpg');
    expect(product.discount).toBe(0.1);
  });

  it('should allow optional discount field to be undefined', () => {
    const product: Product = {
      productId: 2,
      supplierId: 1,
      name: 'Desk Lamp',
      description: 'LED desk lamp',
      price: 49.99,
      sku: 'LMP-002',
      unit: 'piece',
      imgName: 'desk-lamp.jpg',
    };
    expect(product.discount).toBeUndefined();
  });

  it('should support float price and discount values', () => {
    const product: Product = {
      productId: 3,
      supplierId: 1,
      name: 'Notebook',
      description: '100 pages ruled notebook',
      price: 4.99,
      sku: 'NTB-003',
      unit: 'piece',
      imgName: 'notebook.jpg',
      discount: 0.25,
    };
    expect(typeof product.price).toBe('number');
    expect(product.price).toBeGreaterThan(0);
    expect(product.discount).toBe(0.25);
  });

  it('should have numeric productId and supplierId', () => {
    const product: Product = {
      productId: 50,
      supplierId: 10,
      name: 'Stapler',
      description: 'Heavy duty stapler',
      price: 12.5,
      sku: 'STP-004',
      unit: 'piece',
      imgName: 'stapler.jpg',
    };
    expect(typeof product.productId).toBe('number');
    expect(typeof product.supplierId).toBe('number');
    expect(Number.isInteger(product.productId)).toBe(true);
    expect(Number.isInteger(product.supplierId)).toBe(true);
  });

  it('should support partial spread for updates', () => {
    const original: Product = {
      productId: 1,
      supplierId: 1,
      name: 'Original Product',
      description: 'Original description',
      price: 10.0,
      sku: 'ORI-001',
      unit: 'box',
      imgName: 'original.jpg',
    };
    const updated: Product = { ...original, price: 15.0, name: 'Updated Product' };
    expect(updated.price).toBe(15.0);
    expect(updated.name).toBe('Updated Product');
    expect(updated.productId).toBe(original.productId);
    expect(updated.sku).toBe(original.sku);
  });
});
