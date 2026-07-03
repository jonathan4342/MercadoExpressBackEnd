import { Request } from 'express';
import { MovementType } from '../../domain/entities/inventory-movement.entity';
import { StockAdjustment } from '../../domain/value-objects/stock-adjustment.vo';
import { BaseRequestMapper } from './request-mapper';

export interface AdjustStockRequest {
  productUid: string;
  adjustment: StockAdjustment;
}

/**
 * POST /products/:uid/adjustments — une params + body y construye el
 * VO de dominio StockAdjustment; el DTO no cruza el controlador.
 */
export class AdjustStockMapper extends BaseRequestMapper<AdjustStockRequest> {
  public map(req: Request): AdjustStockRequest {
    const b = req.body ?? {};
    return {
      productUid: this.requireString(req.params.uid, 'uid'),
      adjustment: StockAdjustment.create({
        type: this.requireEnum(b.type, [MovementType.ENTRADA, MovementType.SALIDA], 'type'),
        quantity: this.requireNumber(b.quantity, 'quantity'),
        reason: this.requireString(b.reason, 'reason')
      })
    };
  }
}
