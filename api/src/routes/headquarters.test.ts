import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import headquartersRouter from './headquarters';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const headquartersPayload = {
  name: 'Test HQ',
  description: 'Test',
  address: '123 HQ St',
  contactPerson: 'HQ Manager',
  email: 'hq@test.com',
  phone: '555-0100',
};

describe('Headquarters API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    app = express();
    app.use(express.json());
    app.use('/headquarters', headquartersRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createHeadquarters() {
    return request(app).post('/headquarters').send(headquartersPayload);
  }

  it('creates a headquarters', async () => {
    const response = await createHeadquarters();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(headquartersPayload);
    expect(response.body.headquartersId).toBe(1);
  });

  it('gets all headquarters', async () => {
    await createHeadquarters();

    const response = await request(app).get('/headquarters');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(headquartersPayload);
  });

  it('gets a headquarters by id', async () => {
    const createResponse = await createHeadquarters();

    const response = await request(app).get(`/headquarters/${createResponse.body.headquartersId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      headquartersId: createResponse.body.headquartersId,
      ...headquartersPayload,
    });
  });

  it('updates a headquarters', async () => {
    const createResponse = await createHeadquarters();

    const response = await request(app)
      .put(`/headquarters/${createResponse.body.headquartersId}`)
      .send({ ...headquartersPayload, name: 'Updated HQ' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated HQ');
  });

  it('deletes a headquarters', async () => {
    const createResponse = await createHeadquarters();

    const deleteResponse = await request(app).delete(`/headquarters/${createResponse.body.headquartersId}`);
    const getResponse = await request(app).get(`/headquarters/${createResponse.body.headquartersId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing headquarters', async () => {
    const response = await request(app).get('/headquarters/999');

    expect(response.status).toBe(404);
  });

  it('gets headquarters metrics', async () => {
    const createResponse = await createHeadquarters();

    const response = await request(app).get(`/headquarters/${createResponse.body.headquartersId}/metrics`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      score: 1,
      average: 0.5,
      display: 'HQ-10',
    });
  });

  it('returns 404 for a non-existing headquarters', async () => {
    const response = await request(app).get('/headquarters/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing headquarters', async () => {
    const response = await request(app)
      .put('/headquarters/999')
      .send({ ...headquartersPayload, name: 'Updated HQ' });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing headquarters', async () => {
    const response = await request(app).delete('/headquarters/999');

    expect(response.status).toBe(404);
  });

  it('returns 400 when creating headquarters with empty name', async () => {
    const response = await request(app)
      .post('/headquarters')
      .send({ name: '', address: '123 Test St' });

    expect(response.status).toBe(400);
  });

  it('returns 404 for metrics of a non-existing headquarters', async () => {
    const response = await request(app).get('/headquarters/999/metrics');

    expect(response.status).toBe(404);
  });

  it('returns 404 for label of a non-existing headquarters', async () => {
    const response = await request(app).get('/headquarters/999/label');

    expect(response.status).toBe(404);
  });
});
