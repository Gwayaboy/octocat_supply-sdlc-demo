import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { OrderDetailsRepository } from './orderDetailsRepo';

describe('OrderDetailsRepository', () => {
  let db: DatabaseConnection;
  let repository: OrderDetailsRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [2, 'HQ Two']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Branch One', 'Seed branch', '123 Main St', 'Branch One Contact', 'branch1@test.com', '555-4001'],
    );
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 2, 'Branch Two', 'Seed branch', '456 Side St', 'Branch Two Contact', 'branch2@test.com', '555-4002'],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Supplier One', 'Seed supplier', 'Supplier One Contact', 'supplier1@test.com', '555-4101', 1, 1],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 'Supplier Two', 'Seed supplier', 'Supplier Two Contact', 'supplier2@test.com', '555-4102', 1, 0],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Product One', 'Seed product', 10.5, 'SKU-001', 'piece', 'one.jpg', 0],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 2, 'Product Two', 'Seed product', 20, 'SKU-002', 'box', 'two.jpg', 0.1],
    );
    await db.run(
      'INSERT INTO orders (order_id, branch_id, order_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, '2024-01-10', 'Order One', 'Seed order', 'pending'],
    );
    await db.run(
      'INSERT INTO orders (order_id, branch_id, order_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 2, '2024-01-20', 'Order Two', 'Seed order', 'processing'],
    );
    repository = new OrderDetailsRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertOrderDetail(id: number, orderId: number, productId: number, quantity: number, unitPrice: number, notes = 'Seed notes') {
    await db.run(
      'INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, orderId, productId, quantity, unitPrice, notes],
    );
  }

  it('findAll returns an empty array when no order details exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all order details', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);
    await insertOrderDetail(2, 2, 2, 4, 20);

    const orderDetails = await repository.findAll();

    expect(orderDetails).toHaveLength(2);
    expect(orderDetails.map((item) => item.orderDetailId)).toEqual([1, 2]);
  });

  it('findById returns an order detail when found', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5, 'Priority order');

    await expect(repository.findById(1)).resolves.toMatchObject({
      orderDetailId: 1,
      orderId: 1,
      productId: 1,
      quantity: 2,
      unitPrice: 10.5,
      notes: 'Priority order',
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns an order detail', async () => {
    const orderDetail = await repository.create({
      orderId: 1,
      productId: 2,
      quantity: 3,
      unitPrice: 18.25,
      notes: 'Created detail',
    });

    expect(orderDetail.orderDetailId).toBeGreaterThan(0);
    expect(orderDetail).toMatchObject({
      orderId: 1,
      productId: 2,
      quantity: 3,
      unitPrice: 18.25,
      notes: 'Created detail',
    });
  });

  it('update updates and returns an order detail', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);

    const orderDetail = await repository.update(1, {
      orderId: 2,
      productId: 2,
      quantity: 6,
      unitPrice: 21.75,
      notes: 'Updated detail',
    });

    expect(orderDetail).toMatchObject({
      orderDetailId: 1,
      orderId: 2,
      productId: 2,
      quantity: 6,
      unitPrice: 21.75,
      notes: 'Updated detail',
    });
  });

  it('update throws NotFoundError for a non-existing order detail', async () => {
    await expect(repository.update(999, { quantity: 10 })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing order detail', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing order detail', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the order detail exists', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findByOrderId returns order details for the order', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);
    await insertOrderDetail(2, 1, 2, 1, 20);
    await insertOrderDetail(3, 2, 2, 5, 20);

    const orderDetails = await repository.findByOrderId(1);

    expect(orderDetails.map((item) => item.orderDetailId)).toEqual([1, 2]);
  });

  it('findByProductId returns order details for the product', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);
    await insertOrderDetail(2, 2, 1, 4, 11);
    await insertOrderDetail(3, 2, 2, 5, 20);

    const orderDetails = await repository.findByProductId(1);

    expect(orderDetails.map((item) => item.orderDetailId)).toEqual([1, 2]);
  });

  it('getTotalValueByOrderId returns the summed total for the order', async () => {
    await insertOrderDetail(1, 1, 1, 2, 10.5);
    await insertOrderDetail(2, 1, 2, 3, 20);
    await insertOrderDetail(3, 2, 2, 5, 20);

    await expect(repository.getTotalValueByOrderId(1)).resolves.toBe(81);
    await expect(repository.getTotalValueByOrderId(999)).resolves.toBe(0);
  });

  it('findByOrderId throws when the table is missing', async () => {
    await db.run('DROP TABLE order_details');
    await expect(repository.findByOrderId(1)).rejects.toThrow();
  });

  it('findByProductId throws when the table is missing', async () => {
    await db.run('DROP TABLE order_details');
    await expect(repository.findByProductId(1)).rejects.toThrow();
  });

  it('exists throws when the table is missing', async () => {
    await db.run('DROP TABLE order_details');
    await expect(repository.exists(1)).rejects.toThrow();
  });
});
