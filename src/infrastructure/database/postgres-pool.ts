import { Pool } from 'pg';

/** Fábrica del pool de conexiones. Se registra como singleton en el contenedor. */
export class PostgresPoolFactory {
  public static create(): Pool {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
  }
}
