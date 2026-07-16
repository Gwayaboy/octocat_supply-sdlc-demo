import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { DeliveriesRepository } from './deliveriesRepo';

describe('DeliveriesRepository', () => {
  let db: DatabaseConnection;
  let repository: DeliveriesRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Supplier One', 'Seed supplier', 'Casey', 'supplier-one@test.com', '555-2001', 1, 1],
    );
    await db.run(
      'INSERT INTO suppliers (supplier_id, name, description, contact_person, email, phone, active, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 'Supplier Two', 'Seed supplier', 'Jordan', 'supplier-two@test.com', '555-2002', 1, 0],
    );
    repository = new DeliveriesRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertDelivery(id: number, supplierId: number, name: string, deliveryDate: string, status = 'pending') {
    await db.run(
      'INSERT INTO deliveries (delivery_id, supplier_id, delivery_date, name, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, supplierId, deliveryDate, name, `${name} description`, status],
    );
  }

  it('findAll returns an empty array when no deliveries exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all deliveries', async () => {
    await insertDelivery(1, 1, 'Delivery One', '2024-01-10');
    await insertDelivery(2, 2, 'Delivery Two', '2024-01-11');

    const deliveries = await repository.findAll();

    expect(deliveries).toHaveLength(2);
    expect(deliveries.map((delivery) => delivery.deliveryId)).toEqual([1, 2]);
  });

  it('findById returns a delivery when found', async () => {
    await insertDelivery(1, 1, 'Delivery One', '2024-01-10', 'shipped');

    await expect(repository.findById(1)).resolves.toMatchObject({
      deliveryId: 1,
      supplierId: 1,
      name: 'Delivery One',
      status: 'shipped',
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns a delivery', async () => {
    const delivery = await repository.create({
      supplierId: 1,
      deliveryDate: '2024-02-01',
      name: 'Created Delivery',
      description: 'Created description',
      status: 'pending',
    });

    expect(delivery.deliveryId).toBeGreaterThan(0);
    expect(delivery).toMatchObject({
      supplierId: 1,
      deliveryDate: '2024-02-01',
      name: 'Created Delivery',
      status: 'pending',
    });
  });

  it('update updates and returns a delivery', async () => {
    await insertDelivery(1, 1, 'Delivery One', '2024-01-10');

    const delivery = await repository.update(1, {
      supplierId: 2,
      deliveryDate: '2024-03-15',
      name: 'Updated Delivery',
      description: 'Updated description',
      status: 'delivered',
    });

    expect(delivery).toMatchObject({
      deliveryId: 1,
      supplierId: 2,
      deliveryDate: '2024-03-15',
      name: 'Updated Delivery',
      status: 'delivered',
    });
  });

  it('update throws NotFoundError for a non-existing delivery', async () => {
    await expect(repository.update(999, { status: 'delivered' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing delivery', async () => {
    await insertDelivery(1, 1, 'Delete Delivery', '2024-01-10');

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing delivery', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the delivery exists', async () => {
    await insertDelivery(1, 1, 'Exists Delivery', '2024-01-10');

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findBySupplierId returns deliveries for the supplier ordered by delivery date descending', async () => {
    await insertDelivery(1, 1, 'Older Delivery', '2024-01-10');
    await insertDelivery(2, 1, 'Newer Delivery', '2024-01-20');
    await insertDelivery(3, 2, 'Other Supplier Delivery', '2024-01-30');

    const deliveries = await repository.findBySupplierId(1);

    expect(deliveries.map((delivery) => delivery.name)).toEqual(['Newer Delivery', 'Older Delivery']);
  });

  it('findByStatus returns deliveries with the requested status ordered by delivery date descending', async () => {
    await insertDelivery(1, 1, 'Pending Delivery', '2024-01-10', 'pending');
    await insertDelivery(2, 1, 'Delivered Delivery', '2024-01-25', 'delivered');
    await insertDelivery(3, 2, 'Late Delivered Delivery', '2024-01-30', 'delivered');

    const deliveries = await repository.findByStatus('delivered');

    expect(deliveries.map((delivery) => delivery.name)).toEqual([
      'Late Delivered Delivery',
      'Delivered Delivery',
    ]);
  });

  it('findByDateRange returns deliveries within the range ordered by delivery date descending', async () => {
    await insertDelivery(1, 1, 'Before Range', '2024-01-05');
    await insertDelivery(2, 1, 'In Range One', '2024-01-15');
    await insertDelivery(3, 2, 'In Range Two', '2024-01-20');
    await insertDelivery(4, 2, 'After Range', '2024-02-01');

    const deliveries = await repository.findByDateRange('2024-01-10', '2024-01-31');

    expect(deliveries.map((delivery) => delivery.name)).toEqual(['In Range Two', 'In Range One']);
  });

  it('updateStatus updates and returns the delivery status', async () => {
    await insertDelivery(1, 1, 'Status Delivery', '2024-01-10', 'pending');

    const delivery = await repository.updateStatus(1, 'delivered');

    expect(delivery.status).toBe('delivered');
  });
});
