import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { ProductsRepository } from './productsRepo';

describe('ProductsRepository', () => {
  let db: DatabaseConnection;
  let repository: ProductsRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Supplier One', 'Seed supplier', 'Supplier One Contact', 'supplier1@test.com', '555-7001', 1, 1],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 'Supplier Two', 'Seed supplier', 'Supplier Two Contact', 'supplier2@test.com', '555-7002', 1, 0],
    );
    repository = new ProductsRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertProduct(id: number, supplierId: number, name: string, price: number, sku: string, unit = 'piece', discount = 0) {
    await db.run(
      'INSERT INTO products (product_id, supplier_id, name, description, price, sku, unit, img_name, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, supplierId, name, `${name} description`, price, sku, unit, `${sku}.jpg`, discount],
    );
  }

  it('findAll returns an empty array when no products exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all products', async () => {
    await insertProduct(1, 1, 'Product One', 10.5, 'SKU-001');
    await insertProduct(2, 2, 'Product Two', 20, 'SKU-002');

    const products = await repository.findAll();

    expect(products).toHaveLength(2);
    expect(products.map((product) => product.productId)).toEqual([1, 2]);
  });

  it('findById returns a product when found', async () => {
    await insertProduct(1, 1, 'Product One', 10.5, 'SKU-001', 'piece', 0.15);

    await expect(repository.findById(1)).resolves.toMatchObject({
      productId: 1,
      supplierId: 1,
      name: 'Product One',
      price: 10.5,
      sku: 'SKU-001',
      discount: 0.15,
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns a product', async () => {
    const product = await repository.create({
      supplierId: 1,
      name: 'Created Product',
      description: 'Created description',
      price: 12.25,
      sku: 'SKU-CREATED',
      unit: 'box',
      imgName: 'created.jpg',
    });

    expect(product.productId).toBeGreaterThan(0);
    expect(product).toMatchObject({
      supplierId: 1,
      name: 'Created Product',
      description: 'Created description',
      price: 12.25,
      sku: 'SKU-CREATED',
      unit: 'box',
      imgName: 'created.jpg',
      discount: 0,
    });
  });

  it('update updates and returns a product', async () => {
    await insertProduct(1, 1, 'Product One', 10.5, 'SKU-001');

    const product = await repository.update(1, {
      supplierId: 2,
      name: 'Updated Product',
      description: 'Updated description',
      price: 22.75,
      sku: 'SKU-UPDATED',
      unit: 'crate',
      imgName: 'updated.jpg',
      discount: 0.2,
    });

    expect(product).toMatchObject({
      productId: 1,
      supplierId: 2,
      name: 'Updated Product',
      description: 'Updated description',
      price: 22.75,
      sku: 'SKU-UPDATED',
      unit: 'crate',
      imgName: 'updated.jpg',
      discount: 0.2,
    });
  });

  it('update throws NotFoundError for a non-existing product', async () => {
    await expect(repository.update(999, { name: 'Missing Product' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing product', async () => {
    await insertProduct(1, 1, 'Delete Product', 10.5, 'SKU-DELETE');

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing product', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the product exists', async () => {
    await insertProduct(1, 1, 'Exists Product', 10.5, 'SKU-EXISTS');

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findBySupplierId returns products for the supplier ordered by name', async () => {
    await insertProduct(1, 1, 'Zulu Product', 10.5, 'SKU-001');
    await insertProduct(2, 1, 'Alpha Product', 20, 'SKU-002');
    await insertProduct(3, 2, 'Other Supplier Product', 30, 'SKU-003');

    const products = await repository.findBySupplierId(1);

    expect(products.map((product) => product.name)).toEqual(['Alpha Product', 'Zulu Product']);
  });

  it('findByName returns products matching a partial name ordered by name', async () => {
    await insertProduct(1, 1, 'Gamma Widget', 10.5, 'SKU-001');
    await insertProduct(2, 2, 'Alpha Widget', 20, 'SKU-002');
    await insertProduct(3, 2, 'Warehouse Pallet', 30, 'SKU-003');

    const products = await repository.findByName('Widget');

    expect(products.map((product) => product.name)).toEqual(['Alpha Widget', 'Gamma Widget']);
  });
});
