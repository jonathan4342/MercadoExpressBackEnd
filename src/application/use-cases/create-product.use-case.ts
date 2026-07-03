import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Product } from '../../domain/entities/product.entity';
import { ConflictError } from '../../domain/errors/domain.errors';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';

/**
 * RF-01: Registro de productos.
 * Recibe la ENTIDAD de dominio ya construida (el mapper de presentation la crea
 * con Product.create, donde viven las reglas de negocio). Los DTOs no cruzan
 * el controlador. La BD asigna id, uid y SKU; la auditoría registra el actor.
 * No se admiten productos con descripción (nombre) duplicada.
 */
@injectable()
export class CreateProductUseCase {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public async execute(product: Product, actor: string): Promise<Product> {
    return this.uow.execute(async (repos) => {
      const duplicate = await repos.products.findByName(product.name);
      if (duplicate) {
        throw new ConflictError('Ya existe un producto con esa descripción.');
      }
      return repos.products.save(product);
    }, { actor });
  }
}
