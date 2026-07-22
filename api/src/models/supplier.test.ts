import { describe, it, expect } from 'vitest';
import type { Supplier } from './supplier';

describe('Supplier model', () => {
  it('should create a valid supplier object', () => {
    const supplier: Supplier = {
      supplierId: 1,
      name: 'Reliable Co',
      description: 'A reliable supplier for office goods',
      contactPerson: 'John Smith',
      email: 'john@reliable.com',
      phone: '555-1000',
      active: true,
      verified: true,
    };
    expect(supplier.supplierId).toBe(1);
    expect(supplier.name).toBe('Reliable Co');
    expect(supplier.description).toBe('A reliable supplier for office goods');
    expect(supplier.contactPerson).toBe('John Smith');
    expect(supplier.email).toBe('john@reliable.com');
    expect(supplier.phone).toBe('555-1000');
    expect(supplier.active).toBe(true);
    expect(supplier.verified).toBe(true);
  });

  it('should support active=false and verified=false', () => {
    const supplier: Supplier = {
      supplierId: 2,
      name: 'Inactive Co',
      description: 'An inactive supplier',
      contactPerson: 'Jane Doe',
      email: 'jane@inactive.com',
      phone: '555-2000',
      active: false,
      verified: false,
    };
    expect(supplier.active).toBe(false);
    expect(supplier.verified).toBe(false);
  });

  it('should have boolean active and verified fields', () => {
    const supplier: Supplier = {
      supplierId: 3,
      name: 'Boolean Test',
      description: '',
      contactPerson: '',
      email: '',
      phone: '',
      active: true,
      verified: false,
    };
    expect(typeof supplier.active).toBe('boolean');
    expect(typeof supplier.verified).toBe('boolean');
  });

  it('should have numeric supplierId', () => {
    const supplier: Supplier = {
      supplierId: 999,
      name: 'ID Test',
      description: '',
      contactPerson: '',
      email: '',
      phone: '',
      active: true,
      verified: true,
    };
    expect(typeof supplier.supplierId).toBe('number');
    expect(Number.isInteger(supplier.supplierId)).toBe(true);
  });

  it('should support partial spread for updates', () => {
    const original: Supplier = {
      supplierId: 1,
      name: 'Original Supplier',
      description: 'Original description',
      contactPerson: 'Original Contact',
      email: 'original@supplier.com',
      phone: '555-0000',
      active: true,
      verified: false,
    };
    const updated: Supplier = { ...original, name: 'Updated Supplier', verified: true };
    expect(updated.name).toBe('Updated Supplier');
    expect(updated.verified).toBe(true);
    expect(updated.supplierId).toBe(original.supplierId);
    expect(updated.email).toBe(original.email);
  });
});
