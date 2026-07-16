import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import productRouter from './product';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

const productPayload = {
  supplierId: 1,
  name: 'Test Product',
  description: 'Test',
  price: 29.99,
  sku: 'SKU-001',
  unit: 'piece',
  imgName: 'test.jpg',
};

describe('Product API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    const db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Supplier One', 'Seed supplier', 'Supplier Manager', 'supplier@test.com', '555-1000', 1, 0],
    );

    app = express();
    app.use(express.json());
    app.use('/products', productRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function createProduct() {
    return request(app).post('/products').send(productPayload);
  }

  it('creates a product', async () => {
    const response = await createProduct();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ ...productPayload, discount: 0 });
    expect(response.body.productId).toBe(1);
  });

  it('gets all products', async () => {
    await createProduct();

    const response = await request(app).get('/products');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ ...productPayload, discount: 0 });
  });

  it('gets a product by id', async () => {
    const createResponse = await createProduct();

    const response = await request(app).get(`/products/${createResponse.body.productId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      productId: createResponse.body.productId,
      ...productPayload,
      discount: 0,
    });
  });

  it('gets products by name', async () => {
    await createProduct();

    const response = await request(app).get('/products/name/Test%20Product');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Test Product');
  });

  it('updates a product', async () => {
    const createResponse = await createProduct();
    const updatedProduct = {
      ...productPayload,
      name: 'Updated Product',
      price: 39.5,
      imgName: 'updated.jpg',
    };

    const response = await request(app).put(`/products/${createResponse.body.productId}`).send(updatedProduct);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ...updatedProduct, discount: 0 });
  });

  it('deletes a product', async () => {
    const createResponse = await createProduct();

    const deleteResponse = await request(app).delete(`/products/${createResponse.body.productId}`);
    const getResponse = await request(app).get(`/products/${createResponse.body.productId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 for a non-existing product id', async () => {
    const response = await request(app).get('/products/999');

    expect(response.status).toBe(404);
  });

  it('returns 404 for a non-existing product name', async () => {
    const response = await request(app).get('/products/name/Missing%20Product');

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a non-existing product', async () => {
    const response = await request(app)
      .put('/products/999')
      .send({ ...productPayload, name: 'Updated' });

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting a non-existing product', async () => {
    const response = await request(app).delete('/products/999');

    expect(response.status).toBe(404);
  });

  it('returns 500 when the database fails on PUT', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE products');
    const response = await request(app).put('/products/1').send({ supplierId: 1, name: 'X', description: '', price: 10, sku: 'SKU-X', stockQuantity: 1 });
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on DELETE', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE products');
    const response = await request(app).delete('/products/1');
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on POST', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE products');
    const response = await request(app).post('/products').send({ supplierId: 1, name: 'X', description: '', price: 10, sku: 'SKU-X', stockQuantity: 1 });
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on GET all', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE products');
    const response = await request(app).get('/products');
    expect(response.status).toBe(500);
  });

  it('returns 500 when the database fails on GET by ID', async () => {
    const db = await getDatabase();
    await db.run('DROP TABLE products');
    const response = await request(app).get('/products/1');
    expect(response.status).toBe(500);
  });
});
