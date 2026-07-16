import { describe, expect, it } from 'vitest';
import type { Supplier } from './supplier';

describe('Supplier model', () => {
  it('has the expected shape', () => {
    const supplier: Supplier = {
      supplierId: 1,
      name: 'Test Supplier',
      description: 'A test supplier',
      contactPerson: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      active: true,
      verified: false,
    };

    expect(supplier.supplierId).toBe(1);
    expect(typeof supplier.active).toBe('boolean');
    expect(typeof supplier.verified).toBe('boolean');
  });

  it('supports active verified combinations', () => {
    const supplier: Supplier = {
      supplierId: 2,
      name: 'Verified Supplier',
      description: '',
      contactPerson: '',
      email: 'verified@example.com',
      phone: '',
      active: true,
      verified: true,
    };

    expect(supplier.active).toBe(true);
    expect(supplier.verified).toBe(true);
  });

  it('supports multiple suppliers', () => {
    const suppliers: Supplier[] = [
      { supplierId: 1, name: 'Supplier A', description: '', contactPerson: '', email: 'a@test.com', phone: '', active: true, verified: false },
      { supplierId: 2, name: 'Supplier B', description: '', contactPerson: '', email: 'b@test.com', phone: '', active: false, verified: false },
    ];

    expect(suppliers).toHaveLength(2);
    expect(suppliers[0].supplierId).not.toBe(suppliers[1].supplierId);
  });
});
