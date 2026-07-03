import { Request } from 'express';
import { Product } from '../../domain/entities/product.entity';
import { BaseRequestMapper } from './request-mapper';

/**
 * POST /products — el DTO muere aquí: valida la forma del request y construye
 * la ENTIDAD de dominio con Product.create (donde viven las reglas de negocio).
 * Hacia adentro solo viaja dominio. El SKU lo genera la BD, no se recibe.
 */
export class CreateProductMapper extends BaseRequestMapper<Product> {
  public map(req: Request): Product {
    const b = req.body ?? {};
    return Product.create({
      name: this.requireString(b.name, 'name'),
      categoryId: this.requireNumber(b.categoryId, 'categoryId'),   // ID del select del front
      price: this.requireNumber(b.price, 'price'),
      currentStock: this.optionalNumber(b.currentStock, 'currentStock'),
      minimumStock: this.requireNumber(b.minimumStock, 'minimumStock'),
      supplierId: this.requireNumber(b.supplierId, 'supplierId')    // ID del select del front
    });
  }
}
