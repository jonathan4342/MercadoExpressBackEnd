import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ListInventoryUseCase } from '../../../application/use-cases/list-inventory.use-case';
import { InventoryFilters } from '../../../domain/ports/product.repository';
import { ProductResponseMapper } from '../../mappers/response.mappers';

/** GET /api/products — RF-06. */
@injectable()
export class ListInventoryController {
  constructor(
    @inject(TYPES.ListInventoryUseCase) private readonly useCase: ListInventoryUseCase
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const query = res.locals.dto as InventoryFilters;
      const products = await this.useCase.execute(query);
      res.json(products.map(ProductResponseMapper.toDto));
    } catch (e) { next(e); }
  };
}
