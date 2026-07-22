import { describe, it, expect } from 'vitest';
import type { Branch } from './branch';

describe('Branch model', () => {
  it('should create a valid branch object', () => {
    const branch: Branch = {
      branchId: 1,
      headquartersId: 2,
      name: 'Downtown Branch',
      description: 'Main downtown office',
      address: '123 Main St',
      contactPerson: 'Alice Johnson',
      email: 'alice@downtown.com',
      phone: '555-1234',
    };
    expect(branch.branchId).toBe(1);
    expect(branch.headquartersId).toBe(2);
    expect(branch.name).toBe('Downtown Branch');
    expect(branch.description).toBe('Main downtown office');
    expect(branch.address).toBe('123 Main St');
    expect(branch.contactPerson).toBe('Alice Johnson');
    expect(branch.email).toBe('alice@downtown.com');
    expect(branch.phone).toBe('555-1234');
  });

  it('should have integer branchId and headquartersId', () => {
    const branch: Branch = {
      branchId: 42,
      headquartersId: 10,
      name: 'Test Branch',
      description: 'Test',
      address: '456 Test Ave',
      contactPerson: 'Bob',
      email: 'bob@test.com',
      phone: '555-5678',
    };
    expect(typeof branch.branchId).toBe('number');
    expect(typeof branch.headquartersId).toBe('number');
    expect(Number.isInteger(branch.branchId)).toBe(true);
    expect(Number.isInteger(branch.headquartersId)).toBe(true);
  });

  it('should allow valid email format', () => {
    const branch: Branch = {
      branchId: 3,
      headquartersId: 1,
      name: 'Email Test Branch',
      description: '',
      address: '789 Email Rd',
      contactPerson: 'Carol',
      email: 'carol@example.org',
      phone: '555-9012',
    };
    expect(branch.email).toContain('@');
    expect(branch.email).toContain('.');
  });

  it('should support partial object spread for updates', () => {
    const original: Branch = {
      branchId: 1,
      headquartersId: 1,
      name: 'Original',
      description: 'Original description',
      address: '100 Original St',
      contactPerson: 'Original Person',
      email: 'original@test.com',
      phone: '555-0000',
    };
    const updated: Branch = { ...original, name: 'Updated', phone: '555-1111' };
    expect(updated.name).toBe('Updated');
    expect(updated.phone).toBe('555-1111');
    expect(updated.branchId).toBe(original.branchId);
    expect(updated.email).toBe(original.email);
  });
});
