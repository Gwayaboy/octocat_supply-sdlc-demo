import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import orderDetailRouter from './orderDetail';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('OrderDetail API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Seed required foreign keys in dependency order
    const db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'Test HQ']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name) VALUES (?, ?, ?)',
      [1, 1, 'Test Branch'],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'Test Supplier', 'Supplier', 'Contact', 'contact@test.com', '555-7000'],
    );
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, price, sku, unit) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 1, 'Test Product', 10.0, 'TEST-001', 'piece'],
    );
    await db.run(
      "INSERT INTO orders (order_id, branch_id, order_date, name, status) VALUES (?, ?, ?, ?, ?)",
      [1, 1, '2024-01-01', 'Test Order', 'pending'],
    );

    app = express();
    app.use(express.json());
    app.use('/order-details', orderDetailRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new order detail', async () => {
    const newOrderDetail = {
      orderId: 1,
      productId: 1,
      quantity: 5,
      unitPrice: 10.0,
      notes: 'Rush order',
    };
    const response = await request(app).post('/order-details').send(newOrderDetail);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ quantity: 5 });
    expect(response.body.orderDetailId).toBeDefined();
  });

  it('should get all order details', async () => {
    const response = await request(app).get('/order-details');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get an order detail by ID', async () => {
    const newOrderDetail = {
      orderId: 1,
      productId: 1,
      quantity: 3,
      unitPrice: 10.0,
      notes: 'Standard',
    };
    const createResponse = await request(app).post('/order-details').send(newOrderDetail);
    const orderDetailId = createResponse.body.orderDetailId;

    const response = await request(app).get(`/order-details/${orderDetailId}`);
    expect(response.status).toBe(200);
    expect(response.body.orderDetailId).toBe(orderDetailId);
    expect(response.body.quantity).toBe(3);
  });

  it('should return 404 for non-existing order detail on GET', async () => {
    const response = await request(app).get('/order-details/9999');
    expect(response.status).toBe(404);
  });

  it('should update an order detail by ID', async () => {
    const newOrderDetail = {
      orderId: 1,
      productId: 1,
      quantity: 2,
      unitPrice: 10.0,
      notes: 'Original',
    };
    const createResponse = await request(app).post('/order-details').send(newOrderDetail);
    const orderDetailId = createResponse.body.orderDetailId;

    const updatedOrderDetail = { ...newOrderDetail, quantity: 8, notes: 'Updated quantity' };
    const response = await request(app)
      .put(`/order-details/${orderDetailId}`)
      .send(updatedOrderDetail);
    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(8);
  });

  it('should return 404 when updating non-existing order detail', async () => {
    const response = await request(app)
      .put('/order-details/9999')
      .send({ orderId: 1, productId: 1, quantity: 1, unitPrice: 5.0 });
    expect(response.status).toBe(404);
  });

  it('should delete an order detail by ID', async () => {
    const newOrderDetail = {
      orderId: 1,
      productId: 1,
      quantity: 1,
      unitPrice: 10.0,
      notes: 'To be deleted',
    };
    const createResponse = await request(app).post('/order-details').send(newOrderDetail);
    const orderDetailId = createResponse.body.orderDetailId;

    const response = await request(app).delete(`/order-details/${orderDetailId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existing order detail', async () => {
    const response = await request(app).delete('/order-details/9999');
    expect(response.status).toBe(404);
  });
});
