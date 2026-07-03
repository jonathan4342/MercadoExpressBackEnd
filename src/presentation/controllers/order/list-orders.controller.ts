import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ListOrdersUseCase } from '../../../application/use-cases/list-orders.use-case';
import { OrderStatus } from '../../../domain/entities/purchase-order.entity';
import { OrderResponseMapper } from '../../mappers/response.mappers';

/** GET /api/orders — RF-04. */
@injectable()
export class ListOrdersController {
  constructor(
    @inject(TYPES.ListOrdersUseCase) private readonly useCase: ListOrdersUseCase
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = res.locals.dto as OrderStatus | undefined;
      const orders = await this.useCase.execute(status);
      res.json(orders.map(OrderResponseMapper.toDto));
    } catch (e) { next(e); }
  };
}
