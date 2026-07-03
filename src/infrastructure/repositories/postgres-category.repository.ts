import { injectable } from 'inversify';
import { Category } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/ports/category.repository';
import { Queryable } from '../database/queryable';

@injectable()
export class PostgresCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: Queryable) {}

  public async findAll(): Promise<Category[]> {
    const { rows } = await this.db.query(`SELECT id, name FROM categories ORDER BY name`);
    return rows.map((r) => Category.restore(r));
  }
}
