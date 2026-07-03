import { Request } from 'express';
import { BaseRequestMapper } from './request-mapper';

export interface RejectOrderDto {
  orderUid: string;
  reason: string;
}

/** PATCH /orders/:uid/reject — une el param con el motivo del body. */
export class RejectOrderMapper extends BaseRequestMapper<RejectOrderDto> {
  public map(req: Request): RejectOrderDto {
    return {
      orderUid: this.requireString(req.params.uid, 'uid'),
      reason: this.requireString(req.body?.reason, 'reason')
    };
  }
}
