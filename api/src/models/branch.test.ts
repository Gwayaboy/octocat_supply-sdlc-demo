import { describe, expect, it } from 'vitest';
import type { Branch } from './branch';

describe('Branch model', () => {
  it('has the expected shape', () => {
    const branch: Branch = {
      branchId: 1,
      headquartersId: 1,
      name: 'Test Branch',
      description: 'A test branch',
      address: '123 Test St',
      contactPerson: 'Test Person',
      email: 'test@test.com',
      phone: '555-0000',
    };

    expect(branch.branchId).toBe(1);
    expect(typeof branch.headquartersId).toBe('number');
    expect(typeof branch.name).toBe('string');
    expect(typeof branch.email).toBe('string');
  });

  it('stores a valid email string', () => {
    const branch: Branch = {
      branchId: 2,
      headquartersId: 1,
      name: 'Email Branch',
      description: '',
      address: '',
      contactPerson: '',
      email: 'valid@example.com',
      phone: '',
    };

    expect(branch.email).toContain('@');
  });

  it('supports multiple branches with unique ids', () => {
    const branches: Branch[] = [
      { branchId: 1, headquartersId: 1, name: 'Branch A', description: '', address: '', contactPerson: '', email: 'a@test.com', phone: '' },
      { branchId: 2, headquartersId: 1, name: 'Branch B', description: '', address: '', contactPerson: '', email: 'b@test.com', phone: '' },
    ];

    expect(branches).toHaveLength(2);
    expect(branches[0].branchId).not.toBe(branches[1].branchId);
  });
});
