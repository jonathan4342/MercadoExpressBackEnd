import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { ConflictError } from '../../domain/errors/domain.errors';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';
import { FindProductByUidUseCase } from '../use-cases/find-product-by-uid.use-case';
import { GetAlertByUidUseCase } from '../use-cases/get-alert-by-uid.use-case';
import { RegisterOrderUseCase } from '../use-cases/register-order.use-case';

/**
 * Servicio de aplicación (RF-04): orquesta producto + alerta + orden.
 * Entrada: primitivos (sin DTOs). Las reglas ENTRE agregados viven aquí;
 * las de cada agregado, en su entidad (PurchaseOrder.create valida la Regla 2).
 */
@injectable()
export class CreateOrderService {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public execute(
    productUid: string,
    quantity: number,
    alertUid: string | undefined,
    actor: string
  ): Promise<PurchaseOrder> {
    return this.uow.execute(async (repos) => {
      const product = await new FindProductByUidUseCase(repos.products).execute(productUid);

      let alertId: number | null = null;
      if (alertUid) {
        const alert = await new GetAlertByUidUseCase(repos.alerts).execute(alertUid);
        if (alert.productId !== product.id) {
          throw new ConflictError('La alerta no pertenece al producto indicado.');
        }
        if (!alert.isActive()) {
          throw new ConflictError('Solo se puede generar una orden desde una alerta ACTIVA.');
        }
        alertId = alert.id;
      }

      return new RegisterOrderUseCase(repos.orders).execute({
        productId: product.id,
        supplierId: product.supplierId,
        quantity,
        minimumOrderQuantity: product.minimumOrderQuantity(), // Regla 2
        alertId
      });
    }, { actor });
  }
}
