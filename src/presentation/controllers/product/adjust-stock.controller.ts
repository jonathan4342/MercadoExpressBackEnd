import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { AdjustStockService } from '../../../application/services/adjust-stock.service';
import { ActorMapper } from '../../mappers/actor.mapper';
import { AdjustStockRequest } from '../../mappers/adjust-stock.mapper';
import {
  AlertResponseMapper, MovementResponseMapper, ProductResponseMapper
} from '../../mappers/response.mappers';

/** POST /api/products/:uid/adjustments — RF-02. Hacia adentro: uid + VO de dominio. */
@injectable()
export class AdjustStockController {
  constructor(
    @inject(TYPES.AdjustStockService) private readonly service: AdjustStockService
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productUid, adjustment } = res.locals.dto as AdjustStockRequest;
      const result = await this.service.execute(productUid, adjustment, ActorMapper.from(req));
      res.status(201).json({
        product: ProductResponseMapper.toDto(result.product),
        movement: MovementResponseMapper.toDto(result.movement),
        alert: result.alert ? AlertResponseMapper.toDto(result.alert) : null
      });
    } catch (e) { next(e); }
  };
}
