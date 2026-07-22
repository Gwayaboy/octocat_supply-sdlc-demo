import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter from './product';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Product API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Seed required foreign key: supplier id 1
    const db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'Product Supplier', 'Supplier for product tests', 'Contact', 'contact@supplier.com', '555-8000'],
    );

    app = express();
    app.use(express.json());
    app.use('/products', productRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new product', async () => {
    const newProduct = {
      supplierId: 1,
      name: 'Widget A',
      description: 'A useful widget',
      price: 9.99,
      sku: 'WID-001',
      unit: 'piece',
      imgName: 'widget-a.png',
      discount: 0.1,
    };
    const response = await request(app).post('/products').send(newProduct);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Widget A' });
    expect(response.body.productId).toBeDefined();
  });

  it('should get all products', async () => {
    const response = await request(app).get('/products');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get a product by ID', async () => {
    const newProduct = {
      supplierId: 1,
      name: 'Gadget B',
      description: 'A cool gadget',
      price: 19.99,
      sku: 'GAD-002',
      unit: 'piece',
      imgName: 'gadget-b.png',
    };
    const createResponse = await request(app).post('/products').send(newProduct);
    const productId = createResponse.body.productId;

    const response = await request(app).get(`/products/${productId}`);
    expect(response.status).toBe(200);
    expect(response.body.productId).toBe(productId);
    expect(response.body.name).toBe('Gadget B');
  });

  it('should return 404 for non-existing product on GET', async () => {
    const response = await request(app).get('/products/9999');
    expect(response.status).toBe(404);
  });

  it('should get a product by name', async () => {
    const newProduct = {
      supplierId: 1,
      name: 'NamedProduct',
      description: 'Searchable product',
      price: 5.0,
      sku: 'NAM-003',
      unit: 'box',
      imgName: 'named-product.png',
    };
    await request(app).post('/products').send(newProduct);

    const response = await request(app).get('/products/name/NamedProduct');
    expect(response.status).toBe(200);
    // findByName returns an array of matching products
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].name).toBe('NamedProduct');
  });

  it('should return empty array for non-existing product name', async () => {
    // findByName returns an array; an empty array is truthy so the route returns 200 with []
    const response = await request(app).get('/products/name/NonExistent');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  it('should update a product by ID', async () => {
    const newProduct = {
      supplierId: 1,
      name: 'Original Product',
      description: 'Original',
      price: 15.0,
      sku: 'ORI-004',
      unit: 'unit',
      imgName: 'original.png',
    };
    const createResponse = await request(app).post('/products').send(newProduct);
    const productId = createResponse.body.productId;

    const updatedProduct = { ...newProduct, name: 'Updated Product', price: 20.0 };
    const response = await request(app).put(`/products/${productId}`).send(updatedProduct);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Product');
  });

  it('should return 404 when updating non-existing product', async () => {
    const response = await request(app)
      .put('/products/9999')
      .send({ name: 'Ghost', supplierId: 1, price: 1.0, sku: 'GHO-000', unit: 'piece' });
    expect(response.status).toBe(404);
  });

  it('should delete a product by ID', async () => {
    const newProduct = {
      supplierId: 1,
      name: 'Delete Product',
      description: 'To be deleted',
      price: 0.99,
      sku: 'DEL-005',
      unit: 'piece',
      imgName: 'delete.png',
    };
    const createResponse = await request(app).post('/products').send(newProduct);
    const productId = createResponse.body.productId;

    const response = await request(app).delete(`/products/${productId}`);
    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existing product', async () => {
    const response = await request(app).delete('/products/9999');
    expect(response.status).toBe(404);
  });
});
