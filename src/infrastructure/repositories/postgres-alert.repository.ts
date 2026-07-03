import { injectable } from 'inversify';
import { Alert, AlertStatus } from '../../domain/entities/alert.entity';
import { IAlertRepository } from '../../domain/ports/alert.repository';
import { Queryable } from '../database/queryable';

const BASE_SELECT = `
  SELECT a.id, a.uid, a.product_id, at.code AS type, st.code AS status,
         a.created_at, a.resolved_at
  FROM alerts a
  JOIN alert_types    at ON at.id = a.alert_type_id
  JOIN alert_statuses st ON st.id = a.alert_status_id
`;

@injectable()
export class PostgresAlertRepository implements IAlertRepository {
  constructor(private readonly db: Queryable) {}

  public async findByUid(uid: string): Promise<Alert | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE a.uid = $1`, [uid]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findActiveByProductId(productId: number): Promise<Alert | null> {
    const { rows } = await this.db.query(
      `${BASE_SELECT} WHERE a.product_id = $1 AND st.code = 'ACTIVA'`,
      [productId]
    );
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findAll(status?: AlertStatus): Promise<Alert[]> {
    const sql = status
      ? `${BASE_SELECT} WHERE st.code = $1 ORDER BY a.created_at DESC`
      : `${BASE_SELECT} ORDER BY a.created_at DESC`;
    const { rows } = await this.db.query(sql, status ? [status] : []);
    return rows.map((r) => this.toEntity(r));
  }

  private toEntity(r: any): Alert {
    return Alert.restore({
      id: r.id, uid: r.uid, productId: r.product_id, type: r.type,
      status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at
    });
  }
}
