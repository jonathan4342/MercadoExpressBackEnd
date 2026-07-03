import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { MovementType } from '../../domain/entities/inventory-movement.entity';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';
import { StockAdjustment } from '../../domain/value-objects/stock-adjustment.vo';
import { MarkOrderReceivedUseCase } from '../use-cases/mark-order-received.use-case';
import { RecordMovementUseCase } from '../use-cases/record-movement.use-case';
import { UpdateProductStockUseCase } from '../use-cases/update-product-stock.use-case';

/**
 * Servicio de aplicación (RF-05 + Regla 3): recibir una orden orquesta
 * orden → stock → movimiento en UNA transacción; el trigger de la BD
 * resuelve la alerta si el stock supera el mínimo.
 */
@injectable()
export class ReceiveOrderService {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public execute(orderUid: string, actor: string): Promise<PurchaseOrder> {
    return this.uow.execute(async (repos) => {
      const order = await new MarkOrderReceivedUseCase(repos.orders).execute(orderUid);

      // El VO de dominio modela la entrada de mercadería de la recepción
      const adjustment = StockAdjustment.create({
        type: MovementType.ENTRADA,
        quantity: order.quantity,
        reason: `Recepción de orden de compra ${order.uid}`
      });

      const product = await new UpdateProductStockUseCase(repos.products)
        .execute({ productId: order.productId }, adjustment);

      await new RecordMovementUseCase(repos.movements)
        .execute(product.id, adjustment, product.currentStock);

      return order;
    }, { actor });
  }
}
