import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ListCategoriesUseCase } from '../../../application/use-cases/list-categories.use-case';

/** GET /api/categories — catálogo para el select del front. */
@injectable()
export class ListCategoriesController {
  constructor(
    @inject(TYPES.ListCategoriesUseCase) private readonly useCase: ListCategoriesUseCase
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.useCase.execute();
      res.json(categories.map((c) => ({ id: c.id, name: c.name })));
    } catch (e) { next(e); }
  };
}
