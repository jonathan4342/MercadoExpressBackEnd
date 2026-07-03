import { injectable } from 'inversify';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { IInventoryMovementRepository } from '../../domain/ports/inventory-movement.repository';
import { Queryable } from '../database/queryable';

@injectable()
export class PostgresMovementRepository implements IInventoryMovementRepository {
  constructor(private readonly db: Queryable) {}

  public async append(m: InventoryMovement): Promise<InventoryMovement> {
    const { rows } = await this.db.query(
      `INSERT INTO inventory_movements (product_id, movement_type_id, quantity, reason, stock_after)
       VALUES ($1, (SELECT id FROM movement_types WHERE code = $2), $3, $4, $5)
       RETURNING id, uid, created_at`,
      [m.productId, m.type, m.quantity, m.reason, m.stockAfter]
    );
    return InventoryMovement.restore({
      id: rows[0].id, uid: rows[0].uid, productId: m.productId, type: m.type,
      quantity: m.quantity, reason: m.reason, stockAfter: m.stockAfter,
      createdAt: rows[0].created_at
    });
  }

  public async findByProductId(productId: number): Promise<InventoryMovement[]> {
    const { rows } = await this.db.query(
      `SELECT m.id, m.uid, m.product_id, mt.code AS type, m.quantity, m.reason,
              m.stock_after, m.created_at
       FROM inventory_movements m
       JOIN movement_types mt ON mt.id = m.movement_type_id
       WHERE m.product_id = $1
       ORDER BY m.created_at DESC`,
      [productId]
    );
    return rows.map((r) =>
      InventoryMovement.restore({
        id: r.id, uid: r.uid, productId: r.product_id, type: r.type, quantity: r.quantity,
        reason: r.reason, stockAfter: r.stock_after, createdAt: r.created_at
      })
    );
  }
}
