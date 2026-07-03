import { Request } from 'express';
import { BaseRequestMapper } from './request-mapper';

export interface CreateOrderRequest {
  productUid: string;
  quantity: number;
  alertUid?: string;
}

/** POST /orders — primitivos validados; PurchaseOrder.create (dominio) aplica la Regla 2. */
export class CreateOrderMapper extends BaseRequestMapper<CreateOrderRequest> {
  public map(req: Request): CreateOrderRequest {
    const b = req.body ?? {};
    return {
      productUid: this.requireString(b.productUid, 'productUid'),
      quantity: this.requireNumber(b.quantity, 'quantity'),
      alertUid: this.optionalString(b.alertUid, 'alertUid')
    };
  }
}
