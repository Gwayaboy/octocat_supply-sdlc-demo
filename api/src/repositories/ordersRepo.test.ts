import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { OrdersRepository } from './ordersRepo';

describe('OrdersRepository', () => {
  let db: DatabaseConnection;
  let repository: OrdersRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [2, 'HQ Two']);
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 'Branch One', 'Seed branch', '123 Main St', 'Branch One Contact', 'branch1@test.com', '555-6001'],
    );
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 2, 'Branch Two', 'Seed branch', '456 Side St', 'Branch Two Contact', 'branch2@test.com', '555-6002'],
    );
    repository = new OrdersRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertOrder(id: number, branchId: number, orderDate: string, name: string, status = 'pending') {
    await db.run(
      'INSERT INTO orders (order_id, branch_id, order_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, branchId, orderDate, name, `${name} description`, status],
    );
  }

  it('findAll returns an empty array when no orders exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all orders', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Order One');
    await insertOrder(2, 2, '2024-01-11', 'Order Two');

    const orders = await repository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders.map((order) => order.orderId)).toEqual([1, 2]);
  });

  it('findById returns an order when found', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Order One', 'processing');

    await expect(repository.findById(1)).resolves.toMatchObject({
      orderId: 1,
      branchId: 1,
      orderDate: '2024-01-10',
      name: 'Order One',
      status: 'processing',
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns an order', async () => {
    const order = await repository.create({
      branchId: 1,
      orderDate: '2024-02-01',
      name: 'Created Order',
      description: 'Created description',
      status: 'pending',
    });

    expect(order.orderId).toBeGreaterThan(0);
    expect(order).toMatchObject({
      branchId: 1,
      orderDate: '2024-02-01',
      name: 'Created Order',
      description: 'Created description',
      status: 'pending',
    });
  });

  it('update updates and returns an order', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Order One');

    const order = await repository.update(1, {
      branchId: 2,
      orderDate: '2024-03-01',
      name: 'Updated Order',
      description: 'Updated description',
      status: 'shipped',
    });

    expect(order).toMatchObject({
      orderId: 1,
      branchId: 2,
      orderDate: '2024-03-01',
      name: 'Updated Order',
      description: 'Updated description',
      status: 'shipped',
    });
  });

  it('update throws NotFoundError for a non-existing order', async () => {
    await expect(repository.update(999, { name: 'Missing Order' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing order', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Delete Order');

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing order', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the order exists', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Exists Order');

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findByBranchId returns orders for the branch ordered by order date descending', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Older Order');
    await insertOrder(2, 1, '2024-01-20', 'Newer Order');
    await insertOrder(3, 2, '2024-01-25', 'Other Branch Order');

    const orders = await repository.findByBranchId(1);

    expect(orders.map((order) => order.name)).toEqual(['Newer Order', 'Older Order']);
  });

  it('findByStatus returns orders with the requested status ordered by order date descending', async () => {
    await insertOrder(1, 1, '2024-01-10', 'Pending Order', 'pending');
    await insertOrder(2, 1, '2024-01-15', 'Delivered Order', 'delivered');
    await insertOrder(3, 2, '2024-01-25', 'Shipped Order', 'delivered');

    const orders = await repository.findByStatus('delivered');

    expect(orders.map((order) => order.name)).toEqual(['Shipped Order', 'Delivered Order']);
  });

  it('findByDateRange returns orders within the range ordered by order date descending', async () => {
    await insertOrder(1, 1, '2024-01-05', 'Before Range');
    await insertOrder(2, 1, '2024-01-15', 'In Range One');
    await insertOrder(3, 2, '2024-01-20', 'In Range Two');
    await insertOrder(4, 2, '2024-02-01', 'After Range');

    const orders = await repository.findByDateRange('2024-01-10', '2024-01-31');

    expect(orders.map((order) => order.name)).toEqual(['In Range Two', 'In Range One']);
  });
});
