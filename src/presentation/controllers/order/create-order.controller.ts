import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { CreateOrderService } from '../../../application/services/create-order.service';
import { ActorMapper } from '../../mappers/actor.mapper';
import { CreateOrderRequest } from '../../mappers/create-order.mapper';
import { OrderResponseMapper } from '../../mappers/response.mappers';

/** POST /api/orders — RF-04. Hacia adentro: primitivos validados. */
@injectable()
export class CreateOrderController {
  constructor(
    @inject(TYPES.CreateOrderService) private readonly service: CreateOrderService
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productUid, quantity, alertUid } = res.locals.dto as CreateOrderRequest;
      const order = await this.service.execute(productUid, quantity, alertUid, ActorMapper.from(req));
      res.status(201).json(OrderResponseMapper.toDto(order));
    } catch (e) { next(e); }
  };
}
