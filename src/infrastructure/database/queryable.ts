import { QueryResult } from 'pg';

/**
 * Abstracción mínima sobre Pool / PoolClient: permite que un mismo repositorio
 * funcione con el pool (auto-commit) o dentro de una transacción (client).
 */
export interface Queryable {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
}
