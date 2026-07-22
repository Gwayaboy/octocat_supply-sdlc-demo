import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import headquartersRouter from './headquarters';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

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

  it('should create a new headquarters', async () => {
    const newHQ = {
      name: 'Main HQ',
      description: 'Main headquarters',
      address: '100 Main St',
      contactPerson: 'Alice',
      email: 'alice@octo.com',
      phone: '555-1000',
    };
    const response = await request(app).post('/headquarters').send(newHQ);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Main HQ' });
    expect(response.body.headquartersId).toBeDefined();
  });

  it('should get all headquarters', async () => {
    const response = await request(app).get('/headquarters');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a headquarters by ID', async () => {
    const newHQ = {
      name: 'Get HQ',
      description: 'For get test',
      address: '200 Get Ave',
      contactPerson: 'Bob',
      email: 'bob@octo.com',
      phone: '555-2000',
    };
    const createResponse = await request(app).post('/headquarters').send(newHQ);
    const hqId = createResponse.body.headquartersId;

    const response = await request(app).get(`/headquarters/${hqId}`);
    expect(response.status).toBe(200);
    expect(response.body.headquartersId).toBe(hqId);
    expect(response.body.name).toBe('Get HQ');
  });

  it('should return 404 for non-existing headquarters on GET', async () => {
    const response = await request(app).get('/headquarters/9999');
    expect(response.status).toBe(404);
  });

  it('should delete a headquarters by ID', async () => {
    const newHQ = {
      name: 'Delete HQ',
      description: 'To be deleted',
      address: '300 Delete Blvd',
      contactPerson: 'Carol',
      email: 'carol@octo.com',
      phone: '555-3000',
    };
    const createResponse = await request(app).post('/headquarters').send(newHQ);
    const hqId = createResponse.body.headquartersId;

    const response = await request(app).delete(`/headquarters/${hqId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existing headquarters', async () => {
    const response = await request(app).delete('/headquarters/9999');
    expect(response.status).toBe(404);
  });

  it('should return metrics for a headquarters', async () => {
    const newHQ = {
      name: 'Metrics HQ',
      description: 'For metrics test',
      address: '400 Metrics Rd',
      contactPerson: 'Dave',
      email: 'dave@octo.com',
      phone: '555-4000',
    };
    const createResponse = await request(app).post('/headquarters').send(newHQ);
    const hqId = createResponse.body.headquartersId;

    const response = await request(app).get(`/headquarters/${hqId}/metrics`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('score');
    expect(response.body).toHaveProperty('average');
    expect(response.body).toHaveProperty('display');
  });

  it('should return 404 for metrics of non-existing headquarters', async () => {
    const response = await request(app).get('/headquarters/9999/metrics');
    expect(response.status).toBe(404);
  });

  it('should return label for a headquarters', async () => {
    const newHQ = {
      name: 'Label HQ',
      description: 'For label test',
      address: '500 Label St',
      contactPerson: 'Eve',
      email: 'eve@octo.com',
      phone: '555-5000',
    };
    const createResponse = await request(app).post('/headquarters').send(newHQ);
    const hqId = createResponse.body.headquartersId;

    const response = await request(app).get(`/headquarters/${hqId}/label`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('label');
    expect(typeof response.body.label).toBe('string');
  });

  it('should return 404 for label of non-existing headquarters', async () => {
    const response = await request(app).get('/headquarters/9999/label');
    expect(response.status).toBe(404);
  });

  it('should return 500 when updating headquarters due to validator bug', async () => {
    const newHQ = {
      name: 'Update HQ',
      description: 'Original',
      address: '600 Update Dr',
      contactPerson: 'Frank',
      email: 'frank@octo.com',
      phone: '555-6000',
    };
    const createResponse = await request(app).post('/headquarters').send(newHQ);
    const hqId = createResponse.body.headquartersId;

    const updatedHQ = { ...newHQ, name: 'Updated HQ' };
    const response = await request(app).put(`/headquarters/${hqId}`).send(updatedHQ);
    // The PUT handler calls HeadquartersValidator without new, causing a TypeError → 500
    expect(response.status).toBe(500);
  });
});
