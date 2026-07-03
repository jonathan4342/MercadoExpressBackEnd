import { Product } from '../../domain/entities/product.entity';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.errors';
import { IProductRepository } from '../../domain/ports/product.repository';
import { StockAdjustment } from '../../domain/value-objects/stock-adjustment.vo';

/**
 * Caso de uso de UN repositorio (products): bloquea la fila (FOR UPDATE),
 * delega el ajuste en la entidad (Regla 1 en el dominio) y guarda.
 * Recibe solo dominio: un localizador primitivo y el VO StockAdjustment.
 */
export class UpdateProductStockUseCase {
  constructor(private readonly products: IProductRepository) {}

  public async execute(
    ref: { productUid?: string; productId?: number },
    adjustment: StockAdjustment
  ): Promise<Product> {
    if (ref.productUid === undefined && ref.productId === undefined) {
      throw new ValidationError('Se requiere productUid o productId para actualizar el stock.');
    }

    const product = ref.productUid !== undefined
      ? await this.products.findByUidForUpdate(ref.productUid)
      : await this.products.findByIdForUpdate(ref.productId!);

    if (!product) {
      throw new NotFoundError('Producto', String(ref.productUid ?? ref.productId));
    }

    product.adjust(adjustment); // la entidad aplica la regla de negocio
    return this.products.save(product);
  }
}
