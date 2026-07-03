import { Request } from 'express';
import { InventoryFilters } from '../../domain/ports/product.repository';
import { BaseRequestMapper } from './request-mapper';

/** GET /products — construye los filtros del puerto de dominio (RF-06). */
export class InventoryQueryMapper extends BaseRequestMapper<InventoryFilters> {
  public map(req: Request): InventoryFilters {
    const q = req.query;
    return {
      category: this.optionalString(q.category, 'category'),
      supplier: this.optionalString(q.supplier, 'supplier'),
      activeAlert: q.activeAlert === 'true',
      minStock: this.optionalNumber(q.minStock, 'minStock'),
      maxStock: this.optionalNumber(q.maxStock, 'maxStock')
    };
  }
}
