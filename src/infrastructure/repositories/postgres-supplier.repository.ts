import { injectable } from 'inversify';
import { Supplier } from '../../domain/entities/supplier.entity';
import { ISupplierRepository } from '../../domain/ports/supplier.repository';
import { Queryable } from '../database/queryable';

@injectable()
export class PostgresSupplierRepository implements ISupplierRepository {
  constructor(private readonly db: Queryable) {}

  public async findAll(): Promise<Supplier[]> {
    const { rows } = await this.db.query(`SELECT id, name FROM suppliers ORDER BY name`);
    return rows.map((r) => Supplier.restore(r));
  }
}
