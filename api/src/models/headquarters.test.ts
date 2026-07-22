import { describe, it, expect } from 'vitest';
import type { Headquarters } from './headquarters';

describe('Headquarters model', () => {
  it('should create a valid headquarters object with required fields', () => {
    const hq: Headquarters = {
      headquartersId: 1,
      name: 'Global HQ',
      description: 'Main global headquarters',
      address: '1 Corporate Plaza',
      contactPerson: 'CEO Office',
      email: 'hq@global.com',
      phone: '555-0001',
    };
    expect(hq.headquartersId).toBe(1);
    expect(hq.name).toBe('Global HQ');
    expect(hq.description).toBe('Main global headquarters');
    expect(hq.address).toBe('1 Corporate Plaza');
    expect(hq.contactPerson).toBe('CEO Office');
    expect(hq.email).toBe('hq@global.com');
    expect(hq.phone).toBe('555-0001');
  });

  it('should support optional fields city, country, floorCount, capacity', () => {
    const hq: Headquarters = {
      headquartersId: 2,
      name: 'Regional HQ',
      description: 'Regional office',
      address: '50 Regional Ave',
      contactPerson: 'Regional Manager',
      email: 'regional@hq.com',
      phone: '555-0002',
      city: 'Metropolis',
      country: 'US',
      floorCount: 10,
      capacity: 500,
    };
    expect(hq.city).toBe('Metropolis');
    expect(hq.country).toBe('US');
    expect(hq.floorCount).toBe(10);
    expect(hq.capacity).toBe(500);
  });

  it('should allow headquarters without optional fields', () => {
    const hq: Headquarters = {
      headquartersId: 3,
      name: 'Minimal HQ',
      description: '',
      address: '',
      contactPerson: '',
      email: '',
      phone: '',
    };
    expect(hq.city).toBeUndefined();
    expect(hq.country).toBeUndefined();
    expect(hq.floorCount).toBeUndefined();
    expect(hq.capacity).toBeUndefined();
  });

  it('should have numeric headquartersId', () => {
    const hq: Headquarters = {
      headquartersId: 99,
      name: 'Numeric HQ',
      description: '',
      address: '',
      contactPerson: '',
      email: '',
      phone: '',
    };
    expect(typeof hq.headquartersId).toBe('number');
    expect(Number.isInteger(hq.headquartersId)).toBe(true);
  });
});
