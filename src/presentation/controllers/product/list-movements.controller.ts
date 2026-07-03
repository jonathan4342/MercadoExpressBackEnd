import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ListProductMovementsService } from '../../../application/services/list-product-movements.service';
import { MovementResponseMapper } from '../../mappers/response.mappers';

/** GET /api/products/:uid/movements — RF-02. */
@injectable()
export class ListMovementsController {
  constructor(
    @inject(TYPES.ListProductMovementsService) private readonly service: ListProductMovementsService
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const productUid = res.locals.dto as string;
      const movements = await this.service.execute(productUid);
      res.json(movements.map(MovementResponseMapper.toDto));
    } catch (e) { next(e); }
  };
}
