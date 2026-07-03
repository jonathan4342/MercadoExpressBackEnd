import { injectable } from 'inversify';
import { Pool } from 'pg';
import { IUnitOfWork, RepositoryContext, UnitOfWorkOptions } from '../../domain/ports/unit-of-work';
import { PostgresAlertRepository } from '../repositories/postgres-alert.repository';
import { PostgresMovementRepository } from '../repositories/postgres-movement.repository';
import { PostgresOrderRepository } from '../repositories/postgres-order.repository';
import { PostgresProductRepository } from '../repositories/postgres-product.repository';

/**
 * Adaptador de Unidad de Trabajo:
 *  - BEGIN / COMMIT / ROLLBACK sobre un mismo client
 *  - registra el actor en app.current_user (leído por audit_row_change para changed_by)
 */
@injectable()
export class PostgresUnitOfWork implements IUnitOfWork {
  constructor(private readonly pool: Pool) {}

  public async execute<T>(
    work: (repos: RepositoryContext) => Promise<T>,
    options?: UnitOfWorkOptions
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // set_config(..., true) = válido solo dentro de esta transacción
      await client.query(`SELECT set_config('app.current_user', $1, true)`, [
        options?.actor ?? 'sistema'
      ]);

      const repos: RepositoryContext = {
        products: new PostgresProductRepository(client),
        movements: new PostgresMovementRepository(client),
        alerts: new PostgresAlertRepository(client),
        orders: new PostgresOrderRepository(client)
      };
      const result = await work(repos);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
