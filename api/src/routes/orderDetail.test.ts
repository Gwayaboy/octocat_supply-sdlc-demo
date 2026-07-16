import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import orderDetailRouter from './orderDetail';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const orderDetailPayload = {
  orderId: 1,
  productId: 1,
  quantity: 5,
  unitPrice: 10.99,
  notes: 'Test notes',
};

describe('Order Detail API', () => {
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

    app = express();
    app.use(express.json());
    app.use('/order-details', orderDetailRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createOrderDetail() {
    return request(app).post('/order-details').send(orderDetailPayload);
  }

  it('creates an order detail', async () => {
    const response = await createOrderDetail();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(orderDetailPayload);
    expect(response.body.orderDetailId).toBe(1);
  });

  it('gets all order details', async () => {
    await createOrderDetail();

    const response = await request(app).get('/order-details');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(orderDetailPayload);
  });

  it('gets an order detail by id', async () => {
    const createResponse = await createOrderDetail();

    const response = await request(app).get(`/order-details/${createResponse.body.orderDetailId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      orderDetailId: createResponse.body.orderDetailId,
      ...orderDetailPayload,
    });
  });

  it('updates an order detail', async () => {
    const createResponse = await createOrderDetail();
    const updatedOrderDetail = {
      ...orderDetailPayload,
      quantity: 10,
      unitPrice: 12.5,
      notes: 'Updated notes',
    };

    const response = await request(app)
      .put(`/order-details/${createResponse.body.orderDetailId}`)
      .send(updatedOrderDetail);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(updatedOrderDetail);
  });

  it('deletes an order detail', async () => {
    const createResponse = await createOrderDetail();

    const deleteResponse = await request(app).delete(`/order-details/${createResponse.body.orderDetailId}`);
    const getResponse = await request(app).get(`/order-details/${createResponse.body.orderDetailId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing order detail', async () => {
    const response = await request(app).get('/order-details/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing order detail', async () => {
    const response = await request(app)
      .put('/order-details/999')
      .send({ ...orderDetailPayload, quantity: 10 });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing order detail', async () => {
    const response = await request(app).delete('/order-details/999');

    expect(response.status).toBe(404);
  });
});
