import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { HeadquartersRepository } from './headquartersRepo';

describe('HeadquartersRepository', () => {
  let db: DatabaseConnection;
  let repository: HeadquartersRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    repository = new HeadquartersRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertHeadquarters(id: number, name: string) {
    await db.run(
      'INSERT INTO headquarters (headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, `${name} description`, `${name} address`, `${name} contact`, `${name.toLowerCase().replace(/\s+/g, '.')}@test.com`, '555-3000'],
    );
  }

  it('findAll returns an empty array when no headquarters exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all headquarters', async () => {
    await insertHeadquarters(1, 'HQ One');
    await insertHeadquarters(2, 'HQ Two');

    const headquarters = await repository.findAll();

    expect(headquarters).toHaveLength(2);
    expect(headquarters.map((item) => item.headquartersId)).toEqual([1, 2]);
  });

  it('findById returns a headquarters when found', async () => {
    await insertHeadquarters(1, 'HQ One');

    await expect(repository.findById(1)).resolves.toMatchObject({
      headquartersId: 1,
      name: 'HQ One',
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns a headquarters', async () => {
    const headquarters = await repository.create({
      name: 'Created HQ',
      description: 'Created description',
      address: '1 Main Plaza',
      contactPerson: 'Harper',
      email: 'created-hq@test.com',
      phone: '555-3111',
    });

    expect(headquarters.headquartersId).toBeGreaterThan(0);
    expect(headquarters).toMatchObject({
      name: 'Created HQ',
      description: 'Created description',
      address: '1 Main Plaza',
    });
  });

  it('update updates and returns a headquarters', async () => {
    await insertHeadquarters(1, 'HQ One');

    const headquarters = await repository.update(1, {
      name: 'Updated HQ',
      description: 'Updated description',
      address: '99 Updated Ave',
    });

    expect(headquarters).toMatchObject({
      headquartersId: 1,
      name: 'Updated HQ',
      description: 'Updated description',
      address: '99 Updated Ave',
    });
  });

  it('update throws NotFoundError for a non-existing headquarters', async () => {
    await expect(repository.update(999, { name: 'Missing HQ' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing headquarters', async () => {
    await insertHeadquarters(1, 'Delete HQ');

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing headquarters', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the headquarters exists', async () => {
    await insertHeadquarters(1, 'Exists HQ');

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findByName returns headquarters matching a partial name ordered by name', async () => {
    await insertHeadquarters(1, 'Gamma Campus');
    await insertHeadquarters(2, 'Alpha Campus');
    await insertHeadquarters(3, 'Warehouse');

    const headquarters = await repository.findByName('Campus');

    expect(headquarters.map((item) => item.name)).toEqual(['Alpha Campus', 'Gamma Campus']);
  });

  it('findByName throws when the table is missing', async () => {
    await db.run('DROP TABLE headquarters');
    await expect(repository.findByName('test')).rejects.toThrow();
  });

  it('exists throws when the table is missing', async () => {
    await db.run('DROP TABLE headquarters');
    await expect(repository.exists(1)).rejects.toThrow();
  });
});
