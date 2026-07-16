import { describe, expect, it } from 'vitest';
import type { Headquarters } from './headquarters';

describe('Headquarters model', () => {
  it('has the expected required fields', () => {
    const headquarters: Headquarters = {
      headquartersId: 1,
      name: 'Main HQ',
      description: 'Primary office',
      address: '123 HQ St',
      contactPerson: 'HQ Manager',
      email: 'hq@example.com',
      phone: '555-0100',
    };

    expect(headquarters.headquartersId).toBe(1);
    expect(typeof headquarters.name).toBe('string');
    expect(typeof headquarters.address).toBe('string');
  });

  it('allows optional location and capacity fields', () => {
    const headquarters: Headquarters = {
      headquartersId: 2,
      name: 'Regional HQ',
      description: '',
      address: '',
      contactPerson: '',
      email: 'regional@example.com',
      phone: '',
      city: 'New York',
      country: 'USA',
      floorCount: 10,
      capacity: 500,
    };

    expect(headquarters.city).toBe('New York');
    expect(headquarters.floorCount).toBeGreaterThan(0);
    expect(headquarters.capacity).toBeGreaterThan(0);
  });

  it('can omit optional fields', () => {
    const headquarters: Headquarters = {
      headquartersId: 3,
      name: 'Lean HQ',
      description: '',
      address: '',
      contactPerson: '',
      email: 'lean@example.com',
      phone: '',
    };

    expect(headquarters.city).toBeUndefined();
    expect(headquarters.floorCount).toBeUndefined();
  });
});
