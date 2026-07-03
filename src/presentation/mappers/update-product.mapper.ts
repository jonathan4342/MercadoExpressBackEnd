import { Request } from 'express';
import { UpdateProductProps } from '../../domain/entities/product.entity';
import { BaseRequestMapper } from './request-mapper';

export interface UpdateProductRequest {
  uid: string;
  changes: UpdateProductProps;
}

/**
 * PUT /products/:uid — une el :uid del path con el body y valida la forma
 * del request. El stock actual no se recibe: se ajusta por RF-02, no aquí.
 */
export class UpdateProductMapper extends BaseRequestMapper<UpdateProductRequest> {
  public map(req: Request): UpdateProductRequest {
    const b = req.body ?? {};
    return {
      uid: this.requireString(req.params.uid, 'uid'),
      changes: {
        name: this.requireString(b.name, 'name'),
        categoryId: this.requireNumber(b.categoryId, 'categoryId'),
        price: this.requireNumber(b.price, 'price'),
        minimumStock: this.requireNumber(b.minimumStock, 'minimumStock'),
        supplierId: this.requireNumber(b.supplierId, 'supplierId')
      }
    };
  }
}
