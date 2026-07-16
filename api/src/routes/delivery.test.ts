import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import deliveryRouter from './delivery';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const deliveryPayload = {
  supplierId: 1,
  deliveryDate: '2024-01-15',
  name: 'Test Delivery',
  description: 'Test',
  status: 'pending',
};

describe('Delivery API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    const db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Test Supplier', 'Seed supplier', 'Supplier Contact', 'supplier@test.com', '555-2000', 1, 0],
    );

    app = express();
    app.use(express.json());
    app.use('/deliveries', deliveryRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createDelivery() {
    return request(app).post('/deliveries').send(deliveryPayload);
  }

  it('creates a delivery', async () => {
    const response = await createDelivery();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(deliveryPayload);
    expect(response.body.deliveryId).toBe(1);
  });

  it('gets all deliveries', async () => {
    await createDelivery();

    const response = await request(app).get('/deliveries');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(deliveryPayload);
  });

  it('gets a delivery by id', async () => {
    const createResponse = await createDelivery();

    const response = await request(app).get(`/deliveries/${createResponse.body.deliveryId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ deliveryId: createResponse.body.deliveryId, ...deliveryPayload });
  });

  it('updates a delivery status', async () => {
    const createResponse = await createDelivery();

    const response = await request(app)
      .put(`/deliveries/${createResponse.body.deliveryId}/status`)
      .send({ status: 'delivered' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('delivered');
  });

  it('updates a delivery', async () => {
    const createResponse = await createDelivery();
    const updatedDelivery = {
      ...deliveryPayload,
      name: 'Updated Delivery',
      description: 'Updated',
      status: 'shipped',
    };

    const response = await request(app)
      .put(`/deliveries/${createResponse.body.deliveryId}`)
      .send(updatedDelivery);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(updatedDelivery);
  });

  it('deletes a delivery', async () => {
    const createResponse = await createDelivery();

    const deleteResponse = await request(app).delete(`/deliveries/${createResponse.body.deliveryId}`);
    const getResponse = await request(app).get(`/deliveries/${createResponse.body.deliveryId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing delivery', async () => {
    const response = await request(app).get('/deliveries/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing delivery', async () => {
    const response = await request(app)
      .put('/deliveries/999')
      .send({ ...deliveryPayload, name: 'Updated' });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing delivery', async () => {
    const response = await request(app).delete('/deliveries/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating status of a non-existing delivery', async () => {
    const response = await request(app)
      .put('/deliveries/999/status')
      .send({ status: 'delivered' });

    expect(response.status).toBe(404);
  });

  it('returns 500 when updating status with an invalid deliveryPartner command', async () => {
    const createResponse = await createDelivery();

    const response = await request(app)
      .put(`/deliveries/${createResponse.body.deliveryId}/status`)
      .send({ status: 'delivered', deliveryPartner: 'nonexistent-partner' });

    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on PUT', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE deliveries');
    const response = await request(app).put('/deliveries/1').send(deliveryPayload);
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on DELETE', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE deliveries');
    const response = await request(app).delete('/deliveries/1');
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on POST', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE deliveries');
    const response = await request(app).post('/deliveries').send(deliveryPayload);
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on GET all', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE deliveries');
    const response = await request(app).get('/deliveries');
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on GET by ID', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE deliveries');
    const response = await request(app).get('/deliveries/1');
    expect(response.status).toBe(500);
  });
});
