import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { NotFoundError } from '../../domain/errors/domain.errors';
import { IPurchaseOrderRepository } from '../../domain/ports/purchase-order.repository';

/** Caso de uso de UN repositorio (orders): transición APROBADA → RECIBIDA (Regla 5). */
export class MarkOrderReceivedUseCase {
  constructor(private readonly orders: IPurchaseOrderRepository) {}

  public async execute(orderUid: string): Promise<PurchaseOrder> {
    const order = await this.orders.findByUidForUpdate(orderUid);
    if (!order) throw new NotFoundError('Orden', orderUid);
    order.receive(); // la entidad valida la transición
    return this.orders.save(order);
  }
}
