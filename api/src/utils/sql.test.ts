import { describe, expect, it } from 'vitest';
import {
  SelectQueryBuilder,
  buildInsertSQL,
  buildUpdateSQL,
  generatePlaceholders,
  mapDatabaseRows,
  objectToCamelCase,
  objectToSnakeCase,
  toCamelCase,
  toSnakeCase,
  validateRequiredFields,
} from './sql';

describe('sql utils', () => {
  it('builds SELECT queries with all clauses', () => {
    const sql = new SelectQueryBuilder('products')
      .select(['product_id', 'name'])
      .join('suppliers', 'products.supplier_id = suppliers.supplier_id')
      .where('active = 1')
      .orderBy('name', 'DESC')
      .limit(10)
      .offset(5)
      .build();

    expect(sql).toBe(
      'SELECT product_id, name FROM products INNER JOIN suppliers ON products.supplier_id = suppliers.supplier_id WHERE active = 1 ORDER BY name DESC LIMIT 10 OFFSET 5',
    );
  });

  it('builds LEFT/RIGHT joins and base query', () => {
    expect(new SelectQueryBuilder('x').build()).toBe('SELECT * FROM x');

    const left = new SelectQueryBuilder('a').join('b', 'a.id = b.id', 'LEFT').build();
    const right = new SelectQueryBuilder('a').join('b', 'a.id = b.id', 'RIGHT').build();

    expect(left).toContain('LEFT JOIN b ON a.id = b.id');
    expect(right).toContain('RIGHT JOIN b ON a.id = b.id');
  });

  it('converts snake/camel case for strings and objects', () => {
    expect(toSnakeCase('contactPerson')).toBe('contact_person');
    expect(toCamelCase('order_detail_id')).toBe('orderDetailId');
    expect(objectToSnakeCase({ productName: 'Widget', unitPrice: 10 })).toEqual({
      product_name: 'Widget',
      unit_price: 10,
    });
    expect(objectToCamelCase<{ orderDetailId: number; unitPrice: number }>({ order_detail_id: 2, unit_price: 15 })).toEqual({
      orderDetailId: 2,
      unitPrice: 15,
    });
  });

  it('maps database rows', () => {
    const rows = mapDatabaseRows<{ supplierId: number; name: string }>([
      { supplier_id: 1, name: 'Acme' },
      { supplier_id: 2, name: 'Globex' },
    ]);
    expect(rows).toEqual([
      { supplierId: 1, name: 'Acme' },
      { supplierId: 2, name: 'Globex' },
    ]);
  });

  it('builds insert and update SQL', () => {
    expect(generatePlaceholders(3)).toBe('?, ?, ?');

    const insert = buildInsertSQL('products', { name: 'W', supplierId: 1, active: true });
    expect(insert.sql).toBe('INSERT INTO products (name, supplier_id, active) VALUES (?, ?, ?)');
    expect(insert.values).toEqual(['W', 1, true]);

    const update = buildUpdateSQL('products', { unitPrice: 100, stockLevel: 12 }, 'product_id = ?');
    expect(update.sql).toBe('UPDATE products SET unit_price = ?, stock_level = ? WHERE product_id = ?');
    expect(update.values).toEqual([100, 12]);
  });

  it('validates required fields', () => {
    expect(() => validateRequiredFields({ name: 'X', email: 'x@y.com' }, ['name', 'email'])).not.toThrow();
    expect(() => validateRequiredFields({ name: '', email: 'x@y.com' }, ['name'])).toThrow(
      "Required field 'name' is missing or empty",
    );
    expect(() => validateRequiredFields({ value: null }, ['value'])).toThrow();
  });
});

