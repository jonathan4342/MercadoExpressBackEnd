import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { OrderStatus, PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { IPurchaseOrderRepository } from '../../domain/ports/purchase-order.repository';

@injectable()
export class ListOrdersUseCase {
  constructor(
    @inject(TYPES.OrderRepository) private readonly orders: IPurchaseOrderRepository
  ) {}

  public execute(status?: OrderStatus): Promise<PurchaseOrder[]> {
    return this.orders.findAll(status);
  }
}
