import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import orderRouter from './order';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const orderPayload = {
  branchId: 1,
  orderDate: '2024-01-15',
  name: 'Test Order',
  description: 'Test',
  status: 'pending',
};

describe('Order API', () => {
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

    app = express();
    app.use(express.json());
    app.use('/orders', orderRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createOrder() {
    return request(app).post('/orders').send(orderPayload);
  }

  it('creates an order', async () => {
    const response = await createOrder();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(orderPayload);
    expect(response.body.orderId).toBe(1);
  });

  it('gets all orders', async () => {
    await createOrder();

    const response = await request(app).get('/orders');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(orderPayload);
  });

  it('gets an order by id', async () => {
    const createResponse = await createOrder();

    const response = await request(app).get(`/orders/${createResponse.body.orderId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ orderId: createResponse.body.orderId, ...orderPayload });
  });

  it('updates an order', async () => {
    const createResponse = await createOrder();
    const updatedOrder = {
      ...orderPayload,
      name: 'Updated Order',
      description: 'Updated description',
      status: 'processing',
    };

    const response = await request(app).put(`/orders/${createResponse.body.orderId}`).send(updatedOrder);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(updatedOrder);
  });

  it('deletes an order', async () => {
    const createResponse = await createOrder();

    const deleteResponse = await request(app).delete(`/orders/${createResponse.body.orderId}`);
    const getResponse = await request(app).get(`/orders/${createResponse.body.orderId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing order', async () => {
    const response = await request(app).get('/orders/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing order', async () => {
    const response = await request(app)
      .put('/orders/999')
      .send({ ...orderPayload, name: 'Updated' });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing order', async () => {
    const response = await request(app).delete('/orders/999');

    expect(response.status).toBe(404);
  });
});
