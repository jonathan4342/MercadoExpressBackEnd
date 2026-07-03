import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository, InventoryFilters } from '../../domain/ports/product.repository';

/** RF-06: Consulta de inventario con filtros. */
@injectable()
export class ListInventoryUseCase {
  constructor(
    @inject(TYPES.ProductRepository) private readonly products: IProductRepository
  ) {}

  public execute(query: InventoryFilters): Promise<Product[]> {
    return this.products.findAll(query);
  }
}
