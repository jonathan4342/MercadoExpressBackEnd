import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ReceiveOrderService } from '../../../application/services/receive-order.service';
import { ActorMapper } from '../../mappers/actor.mapper';
import { OrderResponseMapper } from '../../mappers/response.mappers';

/** PATCH /api/orders/:uid/receive — RF-05 + Regla 3. */
@injectable()
export class ReceiveOrderController {
  constructor(
    @inject(TYPES.ReceiveOrderService) private readonly service: ReceiveOrderService
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderUid = res.locals.dto as string;
      const order = await this.service.execute(orderUid, ActorMapper.from(req));
      res.json(OrderResponseMapper.toDto(order));
    } catch (e) { next(e); }
  };
}
