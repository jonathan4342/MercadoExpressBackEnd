import { Pool, types } from 'pg';

// pg devuelve BIGINT (OID 20) y NUMERIC (OID 1700) como string por defecto,
// para no perder precisión en enteros de 64 bits. En este esquema los BIGINT
// son IDs autoincrementales (muy por debajo de Number.MAX_SAFE_INTEGER) y los
// NUMERIC son montos de precio, así que es seguro parsearlos como number —
// de lo contrario llegan como string hasta el DTO (p. ej. categoryId, price).
types.setTypeParser(20, (v) => Number.parseInt(v, 10));
types.setTypeParser(1700, (v) => Number.parseFloat(v));

/** Fábrica del pool de conexiones. Se registra como singleton en el contenedor. */
export class PostgresPoolFactory {
  public static create(): Pool {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX ?? 10), // en serverless (Vercel) usar 1-3
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
  }
}
