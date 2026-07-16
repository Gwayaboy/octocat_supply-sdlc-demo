import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase, DatabaseConnection } from '../db/sqlite';
import { NotFoundError } from '../utils/errors';
import { BranchesRepository } from './branchesRepo';

describe('BranchesRepository', () => {
  let db: DatabaseConnection;
  let repository: BranchesRepository;

  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);
    db = await getDatabase();
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [1, 'HQ One']);
    await db.run('INSERT INTO headquarters (headquarters_id, name) VALUES (?, ?)', [2, 'HQ Two']);
    repository = new BranchesRepository(db);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function insertBranch(id: number, name: string, headquartersId = 1) {
    await db.run(
      'INSERT INTO branches (branch_id, headquarters_id, name, description, address, contact_person, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, headquartersId, name, `${name} description`, `${name} address`, `${name} contact`, `${name.toLowerCase().replace(/\s+/g, '.')}@test.com`, '555-0100'],
    );
  }

  it('findAll returns an empty array when no branches exist', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('findAll returns all branches', async () => {
    await insertBranch(1, 'North Branch');
    await insertBranch(2, 'South Branch', 2);

    const branches = await repository.findAll();

    expect(branches).toHaveLength(2);
    expect(branches.map((branch) => branch.branchId)).toEqual([1, 2]);
  });

  it('findById returns a branch when found', async () => {
    await insertBranch(1, 'Central Branch');

    await expect(repository.findById(1)).resolves.toMatchObject({
      branchId: 1,
      headquartersId: 1,
      name: 'Central Branch',
    });
  });

  it('findById returns null when not found', async () => {
    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('create creates and returns a branch', async () => {
    const branch = await repository.create({
      headquartersId: 1,
      name: 'Created Branch',
      description: 'Created description',
      address: '123 Created St',
      contactPerson: 'Casey',
      email: 'created@test.com',
      phone: '555-1111',
    });

    expect(branch.branchId).toBeGreaterThan(0);
    expect(branch).toMatchObject({
      headquartersId: 1,
      name: 'Created Branch',
      description: 'Created description',
    });
    await expect(repository.findById(branch.branchId)).resolves.toEqual(branch);
  });

  it('update updates and returns a branch', async () => {
    await insertBranch(1, 'Original Branch');

    const branch = await repository.update(1, {
      headquartersId: 2,
      name: 'Updated Branch',
      description: 'Updated description',
    });

    expect(branch).toMatchObject({
      branchId: 1,
      headquartersId: 2,
      name: 'Updated Branch',
      description: 'Updated description',
    });
  });

  it('update throws NotFoundError for a non-existing branch', async () => {
    await expect(repository.update(999, { name: 'Missing Branch' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('delete removes an existing branch', async () => {
    await insertBranch(1, 'Delete Branch');

    await repository.delete(1);

    await expect(repository.findById(1)).resolves.toBeNull();
  });

  it('delete throws NotFoundError for a non-existing branch', async () => {
    await expect(repository.delete(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('exists returns whether the branch exists', async () => {
    await insertBranch(1, 'Exists Branch');

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
  });

  it('findByHeadquartersId returns branches for the headquarters ordered by name', async () => {
    await insertBranch(1, 'Zulu Branch');
    await insertBranch(2, 'Alpha Branch');
    await insertBranch(3, 'Other Branch', 2);

    const branches = await repository.findByHeadquartersId(1);

    expect(branches.map((branch) => branch.name)).toEqual(['Alpha Branch', 'Zulu Branch']);
  });

  it('findByName returns branches matching a partial name ordered by name', async () => {
    await insertBranch(1, 'Gamma Office');
    await insertBranch(2, 'Alpha Office');
    await insertBranch(3, 'Warehouse');

    const branches = await repository.findByName('Office');

    expect(branches.map((branch) => branch.name)).toEqual(['Alpha Office', 'Gamma Office']);
  });

  it('findByHeadquartersId throws when the table is missing', async () => {
    await db.run('DROP TABLE branches');
    await expect(repository.findByHeadquartersId(1)).rejects.toThrow();
  });

  it('findByName throws when the table is missing', async () => {
    await db.run('DROP TABLE branches');
    await expect(repository.findByName('test')).rejects.toThrow();
  });

  it('exists throws when the table is missing', async () => {
    await db.run('DROP TABLE branches');
    await expect(repository.exists(1)).rejects.toThrow();
  });
});
