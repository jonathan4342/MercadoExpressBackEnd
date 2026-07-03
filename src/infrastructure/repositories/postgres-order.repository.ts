import { injectable } from 'inversify';
import { OrderStatus, PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { IPurchaseOrderRepository } from '../../domain/ports/purchase-order.repository';
import { Queryable } from '../database/queryable';

const BASE_SELECT = `
  SELECT o.id, o.uid, o.product_id, p.uid AS product_uid, o.supplier_id, s.name AS supplier,
         o.alert_id, o.quantity,
         os.code AS status, o.rejection_reason, o.created_at, o.approved_at, o.received_at
  FROM purchase_orders o
  JOIN products       p  ON p.id  = o.product_id
  JOIN suppliers      s  ON s.id  = o.supplier_id
  JOIN order_statuses os ON os.id = o.order_status_id
`;

@injectable()
export class PostgresOrderRepository implements IPurchaseOrderRepository {
  constructor(private readonly db: Queryable) {}

  public async findByUid(uid: string): Promise<PurchaseOrder | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE o.uid = $1`, [uid]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findByUidForUpdate(uid: string): Promise<PurchaseOrder | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE o.uid = $1 FOR UPDATE OF o`, [uid]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findAll(status?: OrderStatus): Promise<PurchaseOrder[]> {
    const sql = status
      ? `${BASE_SELECT} WHERE os.code = $1 ORDER BY o.created_at DESC`
      : `${BASE_SELECT} ORDER BY o.created_at DESC`;
    const { rows } = await this.db.query(sql, status ? [status] : []);
    return rows.map((r) => this.toEntity(r));
  }

  public async save(order: PurchaseOrder): Promise<PurchaseOrder> {
    if (!order.isPersisted()) {
      const { rows } = await this.db.query(
        `INSERT INTO purchase_orders (product_id, supplier_id, alert_id, quantity, order_status_id)
         VALUES ($1, $2, $3, $4, (SELECT id FROM order_statuses WHERE code = $5))
         RETURNING id, uid, created_at,
           (SELECT name FROM suppliers WHERE id = $2) AS supplier`,
        [order.productId, order.supplierId, order.alertId, order.quantity, order.status]
      );
      return PurchaseOrder.restore({
        id: rows[0].id, uid: rows[0].uid, productId: order.productId, productUid: order.productUid,
        supplierId: order.supplierId, supplier: rows[0].supplier,
        alertId: order.alertId, quantity: order.quantity, status: order.status,
        rejectionReason: order.rejectionReason, createdAt: rows[0].created_at,
        approvedAt: order.approvedAt, receivedAt: order.receivedAt
      });
    }

    await this.db.query(
      `UPDATE purchase_orders SET
         order_status_id  = (SELECT id FROM order_statuses WHERE code = $2),
         rejection_reason = $3,
         approved_at      = $4,
         received_at      = $5
       WHERE id = $1`,
      [order.id, order.status, order.rejectionReason, order.approvedAt, order.receivedAt]
    );
    return order;
  }

  private toEntity(r: any): PurchaseOrder {
    return PurchaseOrder.restore({
      id: r.id, uid: r.uid, productId: r.product_id, productUid: r.product_uid,
      supplierId: r.supplier_id, supplier: r.supplier, alertId: r.alert_id,
      quantity: r.quantity, status: r.status, rejectionReason: r.rejection_reason,
      createdAt: r.created_at, approvedAt: r.approved_at, receivedAt: r.received_at
    });
  }
}
