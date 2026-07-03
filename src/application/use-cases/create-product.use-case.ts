import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Product } from '../../domain/entities/product.entity';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';

/**
 * RF-01: Registro de productos.
 * Recibe la ENTIDAD de dominio ya construida (el mapper de presentation la crea
 * con Product.create, donde viven las reglas de negocio). Los DTOs no cruzan
 * el controlador. La BD asigna id, uid y SKU; la auditoría registra el actor.
 */
@injectable()
export class CreateProductUseCase {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public async execute(product: Product, actor: string): Promise<Product> {
    return this.uow.execute(
      (repos) => repos.products.save(product),
      { actor }
    );
  }
}
