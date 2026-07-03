import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Product, UpdateProductProps } from '../../domain/entities/product.entity';
import { ConflictError, NotFoundError } from '../../domain/errors/domain.errors';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';

/**
 * RF-01 (edición): actualiza un producto existente identificado por su uid.
 * Reglas: la descripción (nombre) no puede colisionar con la de otro producto.
 * El stock actual no se modifica aquí (RF-02 lo gestiona vía ajustes).
 * Tras guardar se relee con JOIN para devolver los nombres de categoría/proveedor.
 */
@injectable()
export class UpdateProductUseCase {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public async execute(uid: string, props: UpdateProductProps, actor: string): Promise<Product> {
    return this.uow.execute(async (repos) => {
      const product = await repos.products.findByUidForUpdate(uid);
      if (!product) throw new NotFoundError('Producto', uid);

      const duplicate = await repos.products.findByName(props.name);
      if (duplicate && duplicate.uid !== product.uid) {
        throw new ConflictError('Ya existe otro producto con esa descripción.');
      }

      product.updateDetails(props);
      await repos.products.save(product);

      // Relee para resolver los nombres de categoría/proveedor por JOIN.
      const refreshed = await repos.products.findByUid(uid);
      return refreshed ?? product;
    }, { actor });
  }
}
