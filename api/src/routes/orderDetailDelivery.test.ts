import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import orderDetailDeliveryRouter from './orderDetailDelivery';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const orderDetailDeliveryPayload = {
  orderDetailId: 1,
  deliveryId: 1,
  quantity: 3,
  notes: 'Test',
};

describe('Order Detail Delivery API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    const db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Branch One', 'Seed branch', '123 Branch St', 'Branch Manager', 'branch@test.com', '555-0001'],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Supplier One', 'Seed supplier', 'Supplier Manager', 'supplier@test.com', '555-1000', 1, 0],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Product One', 'Seed product', 19.99, 'SKU-001', 'piece', 'seed.jpg'],
    );
    await db.run(
      'INSERT INTO orders (order_id, branch_id, order_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, '2024-01-10', 'Order One', 'Seed order', 'pending'],
    );
    await db.run(
      'INSERT INTO order_details (order_detail_id, order_id, product_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, 1, 5, 10.99, 'Seed notes'],
    );
    await db.run(
      'INSERT INTO deliveries (delivery_id, supplier_id, delivery_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, '2024-01-15', 'Delivery One', 'Seed delivery', 'pending'],
    );

    app = express();
    app.use(express.json());
    app.use('/order-detail-deliveries', orderDetailDeliveryRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createOrderDetailDelivery() {
    return request(app).post('/order-detail-deliveries').send(orderDetailDeliveryPayload);
  }

  it('creates an order detail delivery', async () => {
    const response = await createOrderDetailDelivery();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(orderDetailDeliveryPayload);
    expect(response.body.orderDetailDeliveryId).toBe(1);
  });

  it('gets all order detail deliveries', async () => {
    await createOrderDetailDelivery();

    const response = await request(app).get('/order-detail-deliveries');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(orderDetailDeliveryPayload);
  });

  it('gets an order detail delivery by id', async () => {
    const createResponse = await createOrderDetailDelivery();

    const response = await request(app).get(
      `/order-detail-deliveries/${createResponse.body.orderDetailDeliveryId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      orderDetailDeliveryId: createResponse.body.orderDetailDeliveryId,
      ...orderDetailDeliveryPayload,
    });
  });

  it('updates an order detail delivery', async () => {
    const createResponse = await createOrderDetailDelivery();
    const updatedOrderDetailDelivery = {
      ...orderDetailDeliveryPayload,
      quantity: 4,
      notes: 'Updated delivery notes',
    };

    const response = await request(app)
      .put(`/order-detail-deliveries/${createResponse.body.orderDetailDeliveryId}`)
      .send(updatedOrderDetailDelivery);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(updatedOrderDetailDelivery);
  });

  it('deletes an order detail delivery', async () => {
    const createResponse = await createOrderDetailDelivery();

    const deleteResponse = await request(app).delete(
      `/order-detail-deliveries/${createResponse.body.orderDetailDeliveryId}`,
    );
    const getResponse = await request(app).get(
      `/order-detail-deliveries/${createResponse.body.orderDetailDeliveryId}`,
    );

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing order detail delivery', async () => {
    const response = await request(app).get('/order-detail-deliveries/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing order detail delivery', async () => {
    const response = await request(app)
      .put('/order-detail-deliveries/999')
      .send({ ...orderDetailDeliveryPayload, quantity: 10 });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing order detail delivery', async () => {
    const response = await request(app).delete('/order-detail-deliveries/999');

    expect(response.status).toBe(404);
  });

  it('returns 500 when the database fails on PUT', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE order_detail_deliveries');
    const response = await request(app).put('/order-detail-deliveries/1').send({ orderDetailId: 1, deliveryId: 1, quantity: 1 });
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on DELETE', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE order_detail_deliveries');
    const response = await request(app).delete('/order-detail-deliveries/1');
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on POST', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE order_detail_deliveries');
    const response = await request(app).post('/order-detail-deliveries').send({ orderDetailId: 1, deliveryId: 1, quantity: 1 });
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on GET all', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE order_detail_deliveries');
    const response = await request(app).get('/order-detail-deliveries');
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on GET by ID', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE order_detail_deliveries');
    const response = await request(app).get('/order-detail-deliveries/1');
    expect(response.status).toBe(500);
  });
});
