import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import supplierRouter from './supplier';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const supplierPayload = {
  name: 'Test Supplier',
  description: 'Test',
  contactPerson: 'John',
  email: 'john@test.com',
  phone: '555-1234',
  active: true,
  verified: false,
};

describe('Supplier API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    app = express();
    app.use(express.json());
    app.use('/suppliers', supplierRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createSupplier() {
    return request(app).post('/suppliers').send(supplierPayload);
  }

  it('creates a supplier', async () => {
    const response = await createSupplier();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(supplierPayload);
    expect(response.body.supplierId).toBe(1);
  });

  it('gets all suppliers', async () => {
    await createSupplier();

    const response = await request(app).get('/suppliers');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(supplierPayload);
  });

  it('gets a supplier by id', async () => {
    const createResponse = await createSupplier();

    const response = await request(app).get(`/suppliers/${createResponse.body.supplierId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ supplierId: createResponse.body.supplierId, ...supplierPayload });
  });

  it('updates a supplier', async () => {
    const createResponse = await createSupplier();
    const updatedSupplier = {
      ...supplierPayload,
      name: 'Updated Supplier',
      verified: true,
    };

    const response = await request(app)
      .put(`/suppliers/${createResponse.body.supplierId}`)
      .send(updatedSupplier);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(updatedSupplier);
  });

  it('deletes a supplier', async () => {
    const createResponse = await createSupplier();

    const deleteResponse = await request(app).delete(`/suppliers/${createResponse.body.supplierId}`);
    const getResponse = await request(app).get(`/suppliers/${createResponse.body.supplierId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing supplier', async () => {
    const response = await request(app).get('/suppliers/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing supplier', async () => {
    const response = await request(app)
      .put('/suppliers/999')
      .send({ ...supplierPayload, name: 'Updated' });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing supplier', async () => {
    const response = await request(app).delete('/suppliers/999');

    expect(response.status).toBe(404);
  });

  it('returns supplier status', async () => {
    const createResponse = await createSupplier();

    const response = await request(app).get(`/suppliers/${createResponse.body.supplierId}/status`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'APPROVED' });
  });

  it('returns 404 for status of non-existing supplier', async () => {
    const response = await request(app).get('/suppliers/999/status');

    expect(response.status).toBe(404);
  });
});
