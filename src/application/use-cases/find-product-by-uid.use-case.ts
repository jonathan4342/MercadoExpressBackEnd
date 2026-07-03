import { Product } from '../../domain/entities/product.entity';
import { NotFoundError } from '../../domain/errors/domain.errors';
import { IProductRepository } from '../../domain/ports/product.repository';

/** Caso de uso de UN repositorio: localizar un producto por su uid público. */
export class FindProductByUidUseCase {
  constructor(private readonly products: IProductRepository) {}

  public async execute(productUid: string): Promise<Product> {
    const product = await this.products.findByUid(productUid);
    if (!product) throw new NotFoundError('Producto', productUid);
    return product;
  }
}
