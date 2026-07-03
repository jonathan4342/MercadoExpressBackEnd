import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { IPurchaseOrderRepository } from '../../domain/ports/purchase-order.repository';

export interface RegisterOrderInput {
  productId: number;
  supplierId: number;
  quantity: number;
  minimumOrderQuantity: number; // Regla 2, la valida la entidad
  alertId: number | null;
}

/** Caso de uso de UN repositorio (orders): construye la entidad y la persiste (RF-04). */
export class RegisterOrderUseCase {
  constructor(private readonly orders: IPurchaseOrderRepository) {}

  public execute(input: RegisterOrderInput): Promise<PurchaseOrder> {
    return this.orders.save(PurchaseOrder.create(input));
  }
}
