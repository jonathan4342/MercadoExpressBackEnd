import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ApproveOrderUseCase } from '../../../application/use-cases/approve-order.use-case';
import { ActorMapper } from '../../mappers/actor.mapper';
import { OrderResponseMapper } from '../../mappers/response.mappers';

/** PATCH /api/orders/:uid/approve — RF-05. */
@injectable()
export class ApproveOrderController {
  constructor(
    @inject(TYPES.ApproveOrderUseCase) private readonly useCase: ApproveOrderUseCase
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderUid = res.locals.dto as string;
      const order = await this.useCase.execute(orderUid, ActorMapper.from(req));
      res.json(OrderResponseMapper.toDto(order));
    } catch (e) { next(e); }
  };
}
