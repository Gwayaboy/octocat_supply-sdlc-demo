import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { OrderDetailDeliveriesRepository } from './orderDetailDeliveriesRepo';

describe('OrderDetailDeliveriesRepository', () => {
  let db: DatabaseConnection;
  let repository: OrderDetailDeliveriesRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Branch One', 'Seed branch', '123 Main St', 'Branch Contact', 'branch@test.com', '555-5001'],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Supplier One', 'Seed supplier', 'Supplier Contact', 'supplier@test.com', '555-5101', 1, 1],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Product One', 'Seed product', 12.5, 'SKU-001', 'piece', 'one.jpg', 0],
    );
    await db.run(
      'INSERT INTO orders (order_id, branch_id, order_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, '2024-01-10', 'Order One', 'Seed order', 'pending'],
    );
    await db.run(
      'INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, 1, 5, 12.5, 'Seed detail'],
    );
    await db.run(
      'INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 1, 1, 7, 12.5, 'Seed detail two'],
    );
    await db.run(
      'INSERT INTO deliveries (delivery_id, supplier_id, delivery_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, '2024-01-15', 'Delivery One', 'Seed delivery', 'pending'],
    );
    await db.run(
      'INSERT INTO deliveries (delivery_id, supplier_id, delivery_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 1, '2024-01-20', 'Delivery Two', 'Seed delivery', 'shipped'],
    );
    repository = new OrderDetailDeliveriesRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertOrderDetailDelivery(id: number, orderDetailId: number, deliveryId: number, quantity: number, notes = 'Seed delivery note') {
    await db.run(
      'INSERT INTO order_detail_deliveries (order_detail_delivery_id, order_detail_id, delivery_id, quantity, notes) VALUES (?, ?, ?, ?, ?)',
      [id, orderDetailId, deliveryId, quantity, notes],
    );
  }

  it('findAll returns an empty array when no order detail deliveries exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all order detail deliveries', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);
    await insertOrderDetailDelivery(2, 2, 2, 4);

    const deliveries = await repository.findAll();

    expect(deliveries).toHaveLength(2);
    expect(deliveries.map((item) => item.orderDetailDeliveryId)).toEqual([1, 2]);
  });

  it('findById returns an order detail delivery when found', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3, 'Matched delivery');

    await expect(repository.findById(1)).resolves.toMatchObject({
      orderDetailDeliveryId: 1,
      orderDetailId: 1,
      deliveryId: 1,
      quantity: 3,
      notes: 'Matched delivery',
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns an order detail delivery', async () => {
    const delivery = await repository.create({
      orderDetailId: 1,
      deliveryId: 1,
      quantity: 3,
      notes: 'Created delivery link',
    });

    expect(delivery.orderDetailDeliveryId).toBeGreaterThan(0);
    expect(delivery).toMatchObject({
      orderDetailId: 1,
      deliveryId: 1,
      quantity: 3,
      notes: 'Created delivery link',
    });
  });

  it('update updates and returns an order detail delivery', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);

    const delivery = await repository.update(1, {
      orderDetailId: 2,
      deliveryId: 2,
      quantity: 6,
      notes: 'Updated delivery link',
    });

    expect(delivery).toMatchObject({
      orderDetailDeliveryId: 1,
      orderDetailId: 2,
      deliveryId: 2,
      quantity: 6,
      notes: 'Updated delivery link',
    });
  });

  it('update throws NotFoundError for a non-existing order detail delivery', async () => {
    await expect(repository.update(999, { quantity: 10 })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing order detail delivery', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing order detail delivery', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the order detail delivery exists', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findByOrderDetailId returns deliveries for the order detail', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);
    await insertOrderDetailDelivery(2, 1, 2, 2);
    await insertOrderDetailDelivery(3, 2, 2, 5);

    const deliveries = await repository.findByOrderDetailId(1);

    expect(deliveries.map((item) => item.orderDetailDeliveryId)).toEqual([1, 2]);
  });

  it('findByDeliveryId returns order detail deliveries for the delivery', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);
    await insertOrderDetailDelivery(2, 2, 1, 4);
    await insertOrderDetailDelivery(3, 2, 2, 5);

    const deliveries = await repository.findByDeliveryId(1);

    expect(deliveries.map((item) => item.orderDetailDeliveryId)).toEqual([1, 2]);
  });

  it('getTotalQuantityByOrderDetailId returns the summed quantity for the order detail', async () => {
    await insertOrderDetailDelivery(1, 1, 1, 3);
    await insertOrderDetailDelivery(2, 1, 2, 4);
    await insertOrderDetailDelivery(3, 2, 2, 5);

    await expect(repository.getTotalQuantityByOrderDetailId(1)).resolves.toBe(7);
    await expect(repository.getTotalQuantityByOrderDetailId(999)).resolves.toBe(0);
  });
});
