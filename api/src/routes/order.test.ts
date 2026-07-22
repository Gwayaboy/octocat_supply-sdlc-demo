import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import orderRouter from './order';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Order API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Seed required foreign keys: headquarters and branch
    const db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'Test HQ']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name) VALUES (?, ?, ?)',
      [1, 1, 'Test Branch'],
    );

    app = express();
    app.use(express.json());
    app.use('/orders', orderRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new order', async () => {
    const newOrder = {
      branchId: 1,
      orderDate: '2024-01-15T10:00:00Z',
      name: 'Winter Order',
      description: 'Seasonal supplies',
      status: 'pending',
    };
    const response = await request(app).post('/orders').send(newOrder);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Winter Order' });
    expect(response.body.orderId).toBeDefined();
  });

  it('should get all orders', async () => {
    const response = await request(app).get('/orders');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get an order by ID', async () => {
    const newOrder = {
      branchId: 1,
      orderDate: '2024-02-10T08:00:00Z',
      name: 'Spring Order',
      description: 'Spring supplies',
      status: 'pending',
    };
    const createResponse = await request(app).post('/orders').send(newOrder);
    const orderId = createResponse.body.orderId;

    const response = await request(app).get(`/orders/${orderId}`);
    expect(response.status).toBe(200);
    expect(response.body.orderId).toBe(orderId);
    expect(response.body.name).toBe('Spring Order');
  });

  it('should return 404 for non-existing order on GET', async () => {
    const response = await request(app).get('/orders/9999');
    expect(response.status).toBe(404);
  });

  it('should update an order by ID', async () => {
    const newOrder = {
      branchId: 1,
      orderDate: '2024-03-05T12:00:00Z',
      name: 'Original Order',
      description: 'Original description',
      status: 'pending',
    };
    const createResponse = await request(app).post('/orders').send(newOrder);
    const orderId = createResponse.body.orderId;

    const updatedOrder = { ...newOrder, name: 'Updated Order', status: 'processing' };
    const response = await request(app).put(`/orders/${orderId}`).send(updatedOrder);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Order');
    expect(response.body.status).toBe('processing');
  });

  it('should return 404 when updating non-existing order', async () => {
    const response = await request(app)
      .put('/orders/9999')
      .send({ branchId: 1, orderDate: '2024-01-01', name: 'Ghost', status: 'pending' });
    expect(response.status).toBe(404);
  });

  it('should delete an order by ID', async () => {
    const newOrder = {
      branchId: 1,
      orderDate: '2024-04-20T14:00:00Z',
      name: 'Delete Order',
      description: 'To be deleted',
      status: 'pending',
    };
    const createResponse = await request(app).post('/orders').send(newOrder);
    const orderId = createResponse.body.orderId;

    const response = await request(app).delete(`/orders/${orderId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existing order', async () => {
    const response = await request(app).delete('/orders/9999');
    expect(response.status).toBe(404);
  });
});
