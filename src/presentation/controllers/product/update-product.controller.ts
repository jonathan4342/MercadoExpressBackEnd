import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { UpdateProductUseCase } from '../../../application/use-cases/update-product.use-case';
import { ActorMapper } from '../../mappers/actor.mapper';
import { UpdateProductRequest } from '../../mappers/update-product.mapper';
import { ProductResponseMapper } from '../../mappers/response.mappers';

/** PUT /api/products/:uid — RF-01 (edición). */
@injectable()
export class UpdateProductController {
  constructor(
    @inject(TYPES.UpdateProductUseCase) private readonly useCase: UpdateProductUseCase
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, changes } = res.locals.dto as UpdateProductRequest;
      const updated = await this.useCase.execute(uid, changes, ActorMapper.from(req));
      res.status(200).json(ProductResponseMapper.toDto(updated));
    } catch (e) { next(e); }
  };
}
