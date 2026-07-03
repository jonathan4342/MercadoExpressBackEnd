import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { RejectOrderUseCase } from '../../../application/use-cases/reject-order.use-case';
import { ActorMapper } from '../../mappers/actor.mapper';
import { RejectOrderDto } from '../../mappers/reject-order.mapper';
import { OrderResponseMapper } from '../../mappers/response.mappers';

/** PATCH /api/orders/:uid/reject — RF-05. */
@injectable()
export class RejectOrderController {
  constructor(
    @inject(TYPES.RejectOrderUseCase) private readonly useCase: RejectOrderUseCase
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = res.locals.dto as RejectOrderDto;
      const order = await this.useCase.execute(dto.orderUid, dto.reason, ActorMapper.from(req));
      res.json(OrderResponseMapper.toDto(order));
    } catch (e) { next(e); }
  };
}
