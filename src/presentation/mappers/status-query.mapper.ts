import { Request } from 'express';
import { AlertStatus } from '../../domain/entities/alert.entity';
import { OrderStatus } from '../../domain/entities/purchase-order.entity';
import { BaseRequestMapper } from './request-mapper';

/** GET /alerts?status= */
export class AlertStatusQueryMapper extends BaseRequestMapper<AlertStatus | undefined> {
  public map(req: Request): AlertStatus | undefined {
    return this.optionalEnum(req.query.status, [AlertStatus.ACTIVA, AlertStatus.RESUELTA], 'status');
  }
}

/** GET /orders?status= */
export class OrderStatusQueryMapper extends BaseRequestMapper<OrderStatus | undefined> {
  public map(req: Request): OrderStatus | undefined {
    return this.optionalEnum(
      req.query.status,
      [OrderStatus.PENDIENTE, OrderStatus.APROBADA, OrderStatus.RECHAZADA, OrderStatus.RECIBIDA],
      'status'
    );
  }
}
