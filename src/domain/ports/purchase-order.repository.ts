import { OrderStatus, PurchaseOrder } from '../entities/purchase-order.entity';

export interface IPurchaseOrderRepository {
  findByUid(uid: string): Promise<PurchaseOrder | null>;
  findByUidForUpdate(uid: string): Promise<PurchaseOrder | null>;
  findAll(status?: OrderStatus): Promise<PurchaseOrder[]>;
  save(order: PurchaseOrder): Promise<PurchaseOrder>;
}
