import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { NotFoundError } from '../../domain/errors/domain.errors';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';

/** RF-05: PENDIENTE → RECHAZADA (motivo mínimo 10 caracteres). */
@injectable()
export class RejectOrderUseCase {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public execute(orderUid: string, reason: string, actor: string): Promise<PurchaseOrder> {
    return this.uow.execute(async (repos) => {
      const order = await repos.orders.findByUidForUpdate(orderUid);
      if (!order) throw new NotFoundError('Orden', orderUid);
      order.reject(reason);
      return repos.orders.save(order);
    }, { actor });
  }
}
