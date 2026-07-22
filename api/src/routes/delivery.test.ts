import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import deliveryRouter from './delivery';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Delivery API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Seed required foreign key: supplier id 1
    const db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'Test Supplier', 'Supplier for tests', 'Test Contact', 'test@supplier.com', '555-9000'],
    );

    app = express();
    app.use(express.json());
    app.use('/deliveries', deliveryRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new delivery', async () => {
    const newDelivery = {
      supplierId: 1,
      deliveryDate: '2024-06-01',
      name: 'June Delivery',
      description: 'Monthly delivery',
      status: 'pending',
    };
    const response = await request(app).post('/deliveries').send(newDelivery);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'June Delivery' });
    expect(response.body.deliveryId).toBeDefined();
  });

  it('should get all deliveries', async () => {
    const response = await request(app).get('/deliveries');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a delivery by ID', async () => {
    const newDelivery = {
      supplierId: 1,
      deliveryDate: '2024-07-01',
      name: 'July Delivery',
      description: 'July monthly delivery',
      status: 'pending',
    };
    const createResponse = await request(app).post('/deliveries').send(newDelivery);
    const deliveryId = createResponse.body.deliveryId;

    const response = await request(app).get(`/deliveries/${deliveryId}`);
    expect(response.status).toBe(200);
    expect(response.body.deliveryId).toBe(deliveryId);
    expect(response.body.name).toBe('July Delivery');
  });

  it('should return 404 for non-existing delivery on GET', async () => {
    const response = await request(app).get('/deliveries/9999');
    expect(response.status).toBe(404);
  });

  it('should update a delivery by ID', async () => {
    const newDelivery = {
      supplierId: 1,
      deliveryDate: '2024-08-01',
      name: 'Original Delivery',
      description: 'Original',
      status: 'pending',
    };
    const createResponse = await request(app).post('/deliveries').send(newDelivery);
    const deliveryId = createResponse.body.deliveryId;

    const updatedDelivery = { ...newDelivery, name: 'Updated Delivery' };
    const response = await request(app).put(`/deliveries/${deliveryId}`).send(updatedDelivery);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Delivery');
  });

  it('should return 404 when updating non-existing delivery', async () => {
    const response = await request(app)
      .put('/deliveries/9999')
      .send({ name: 'Ghost', supplierId: 1, deliveryDate: '2024-01-01', status: 'pending' });
    expect(response.status).toBe(404);
  });

  it('should delete a delivery by ID', async () => {
    const newDelivery = {
      supplierId: 1,
      deliveryDate: '2024-09-01',
      name: 'Delete Delivery',
      description: 'To be deleted',
      status: 'pending',
    };
    const createResponse = await request(app).post('/deliveries').send(newDelivery);
    const deliveryId = createResponse.body.deliveryId;

    const response = await request(app).delete(`/deliveries/${deliveryId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existing delivery', async () => {
    const response = await request(app).delete('/deliveries/9999');
    expect(response.status).toBe(404);
  });

  it('should update delivery status without a delivery partner', async () => {
    const newDelivery = {
      supplierId: 1,
      deliveryDate: '2024-10-01',
      name: 'Status Delivery',
      description: 'For status update test',
      status: 'pending',
    };
    const createResponse = await request(app).post('/deliveries').send(newDelivery);
    const deliveryId = createResponse.body.deliveryId;

    const response = await request(app)
      .put(`/deliveries/${deliveryId}/status`)
      .send({ status: 'delivered' });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('delivered');
  });

  it('should return 404 when updating status of non-existing delivery', async () => {
    const response = await request(app)
      .put('/deliveries/9999/status')
      .send({ status: 'delivered' });
    expect(response.status).toBe(404);
  });
});
