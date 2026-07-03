import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ListSuppliersUseCase } from '../../../application/use-cases/list-suppliers.use-case';

/** GET /api/suppliers — catálogo para el select del front. */
@injectable()
export class ListSuppliersController {
  constructor(
    @inject(TYPES.ListSuppliersUseCase) private readonly useCase: ListSuppliersUseCase
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const suppliers = await this.useCase.execute();
      res.json(suppliers.map((s) => ({ id: s.id, name: s.name })));
    } catch (e) { next(e); }
  };
}
