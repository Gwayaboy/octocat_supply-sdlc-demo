import { describe, it, expect } from 'vitest';
import {
  toSnakeCase,
  toCamelCase,
  objectToSnakeCase,
  objectToCamelCase,
  mapDatabaseRows,
  generatePlaceholders,
  buildInsertSQL,
  buildUpdateSQL,
  validateRequiredFields,
  SelectQueryBuilder,
} from './sql';

describe('toSnakeCase', () => {
  it('converts camelCase to snake_case', () => {
    expect(toSnakeCase('camelCase')).toBe('camel_case');
    expect(toSnakeCase('myVariableName')).toBe('my_variable_name');
    expect(toSnakeCase('supplierId')).toBe('supplier_id');
  });

  it('leaves already snake_case strings unchanged', () => {
    expect(toSnakeCase('snake_case')).toBe('snake_case');
    expect(toSnakeCase('name')).toBe('name');
  });

  it('handles single uppercase letter', () => {
    expect(toSnakeCase('branchId')).toBe('branch_id');
  });
});

describe('toCamelCase', () => {
  it('converts snake_case to camelCase', () => {
    expect(toCamelCase('snake_case')).toBe('snakeCase');
    expect(toCamelCase('supplier_id')).toBe('supplierId');
    expect(toCamelCase('my_variable_name')).toBe('myVariableName');
  });

  it('leaves already camelCase strings unchanged', () => {
    expect(toCamelCase('name')).toBe('name');
    expect(toCamelCase('camelCase')).toBe('camelCase');
  });
});

describe('objectToSnakeCase', () => {
  it('converts object keys from camelCase to snake_case', () => {
    const input = { supplierId: 1, contactPerson: 'John', name: 'Test' };
    const result = objectToSnakeCase(input);
    expect(result).toEqual({ supplier_id: 1, contact_person: 'John', name: 'Test' });
  });

  it('handles empty object', () => {
    expect(objectToSnakeCase({})).toEqual({});
  });
});

describe('objectToCamelCase', () => {
  it('converts object keys from snake_case to camelCase', () => {
    const input = { supplier_id: 1, contact_person: 'John', name: 'Test' };
    const result = objectToCamelCase(input);
    expect(result).toEqual({ supplierId: 1, contactPerson: 'John', name: 'Test' });
  });

  it('handles empty object', () => {
    expect(objectToCamelCase({})).toEqual({});
  });
});

describe('mapDatabaseRows', () => {
  it('converts multiple rows from snake_case to camelCase', () => {
    const rows = [
      { supplier_id: 1, name: 'Supplier A' },
      { supplier_id: 2, name: 'Supplier B' },
    ];
    const result = mapDatabaseRows(rows);
    expect(result).toEqual([
      { supplierId: 1, name: 'Supplier A' },
      { supplierId: 2, name: 'Supplier B' },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(mapDatabaseRows([])).toEqual([]);
  });
});

describe('generatePlaceholders', () => {
  it('generates correct number of placeholders', () => {
    expect(generatePlaceholders(1)).toBe('?');
    expect(generatePlaceholders(3)).toBe('?, ?, ?');
    expect(generatePlaceholders(5)).toBe('?, ?, ?, ?, ?');
  });

  it('returns empty string for zero placeholders', () => {
    expect(generatePlaceholders(0)).toBe('');
  });
});

describe('buildInsertSQL', () => {
  it('builds correct INSERT SQL', () => {
    const data = { name: 'Test', supplierId: 1, description: 'Desc' };
    const { sql, values } = buildInsertSQL('products', data);
    expect(sql).toContain('INSERT INTO products');
    expect(sql).toContain('name');
    expect(sql).toContain('supplier_id');
    expect(sql).toContain('description');
    expect(values).toContain('Test');
    expect(values).toContain(1);
    expect(values).toContain('Desc');
  });

  it('generates correct number of placeholders', () => {
    const data = { a: 1, b: 2, c: 3 };
    const { sql } = buildInsertSQL('test_table', data);
    expect(sql).toContain('?, ?, ?');
  });
});

describe('buildUpdateSQL', () => {
  it('builds correct UPDATE SQL', () => {
    const data = { name: 'Updated', description: 'New Desc' };
    const { sql, values } = buildUpdateSQL('suppliers', data, 'supplier_id = ?');
    expect(sql).toContain('UPDATE suppliers SET');
    expect(sql).toContain('name = ?');
    expect(sql).toContain('description = ?');
    expect(sql).toContain('WHERE supplier_id = ?');
    expect(values).toContain('Updated');
    expect(values).toContain('New Desc');
  });

  it('builds UPDATE SQL for a single field', () => {
    const data = { name: 'Test' };
    const { sql, values } = buildUpdateSQL('suppliers', data, 'supplier_id = ?');
    expect(sql).toBe('UPDATE suppliers SET name = ? WHERE supplier_id = ?');
    expect(values).toEqual(['Test']);
  });
});

describe('validateRequiredFields', () => {
  it('does not throw when all required fields are present', () => {
    const obj = { name: 'Test', email: 'test@example.com' };
    expect(() => validateRequiredFields(obj, ['name', 'email'])).not.toThrow();
  });

  it('throws when a required field is missing', () => {
    const obj = { name: 'Test' };
    expect(() => validateRequiredFields(obj, ['name', 'email'])).toThrow(
      "Required field 'email' is missing or empty",
    );
  });

  it('throws when a required field is empty string', () => {
    const obj = { name: '', email: 'test@example.com' };
    expect(() => validateRequiredFields(obj, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
  });

  it('throws when a required field is null', () => {
    const obj = { name: null, email: 'test@example.com' };
    expect(() => validateRequiredFields(obj as any, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
  });
});

describe('SelectQueryBuilder', () => {
  it('builds a basic SELECT query', () => {
    const builder = new SelectQueryBuilder('suppliers');
    expect(builder.build()).toBe('SELECT * FROM suppliers');
  });

  it('builds a SELECT query with specific columns', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.select(['id', 'name']);
    expect(builder.build()).toBe('SELECT id, name FROM suppliers');
  });

  it('builds a SELECT query with WHERE clause', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.where('supplier_id = 1');
    expect(builder.build()).toBe('SELECT * FROM suppliers WHERE supplier_id = 1');
  });

  it('builds a SELECT query with multiple WHERE conditions', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.where('active = 1').where('verified = 1');
    expect(builder.build()).toBe('SELECT * FROM suppliers WHERE active = 1 AND verified = 1');
  });

  it('builds a SELECT query with ORDER BY', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.orderBy('name');
    expect(builder.build()).toBe('SELECT * FROM suppliers ORDER BY name ASC');
  });

  it('builds a SELECT query with ORDER BY DESC', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.orderBy('name', 'DESC');
    expect(builder.build()).toBe('SELECT * FROM suppliers ORDER BY name DESC');
  });

  it('builds a SELECT query with LIMIT', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.limit(10);
    expect(builder.build()).toBe('SELECT * FROM suppliers LIMIT 10');
  });

  it('builds a SELECT query with OFFSET', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.limit(10).offset(20);
    expect(builder.build()).toBe('SELECT * FROM suppliers LIMIT 10 OFFSET 20');
  });

  it('builds a SELECT query with JOIN', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.join('products', 'products.supplier_id = suppliers.supplier_id');
    expect(builder.build()).toContain('INNER JOIN products ON');
  });

  it('builds a SELECT query with LEFT JOIN', () => {
    const builder = new SelectQueryBuilder('suppliers');
    builder.join('products', 'products.supplier_id = suppliers.supplier_id', 'LEFT');
    expect(builder.build()).toContain('LEFT JOIN products ON');
  });

  it('builds a complex SELECT query', () => {
    const builder = new SelectQueryBuilder('orders');
    builder
      .select(['order_id', 'name', 'status'])
      .where('branch_id = 1')
      .where("status = 'pending'")
      .orderBy('order_id', 'DESC')
      .limit(5)
      .offset(10);
    const sql = builder.build();
    expect(sql).toContain('SELECT order_id, name, status FROM orders');
    expect(sql).toContain('WHERE branch_id = 1 AND status = \'pending\'');
    expect(sql).toContain('ORDER BY order_id DESC');
    expect(sql).toContain('LIMIT 5');
    expect(sql).toContain('OFFSET 10');
  });

  it('supports method chaining', () => {
    const builder = new SelectQueryBuilder('test');
    const result = builder.select(['*']).where('id = 1').orderBy('id').limit(1).offset(0);
    expect(result).toBe(builder);
  });
});
