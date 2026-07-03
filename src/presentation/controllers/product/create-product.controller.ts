import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case';
import { Product } from '../../../domain/entities/product.entity';
import { ActorMapper } from '../../mappers/actor.mapper';
import { ProductResponseMapper } from '../../mappers/response.mappers';

/** POST /api/products — RF-01. El mapper ya construyó la entidad de dominio. */
@injectable()
export class CreateProductController {
  constructor(
    @inject(TYPES.CreateProductUseCase) private readonly useCase: CreateProductUseCase
  ) {}

  public handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = res.locals.dto as Product; // entidad de dominio, no DTO
      const created = await this.useCase.execute(product, ActorMapper.from(req));
      res.status(201).json(ProductResponseMapper.toDto(created));
    } catch (e) { next(e); }
  };
}
