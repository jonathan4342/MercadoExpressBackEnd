import { Request } from 'express';
import { BaseRequestMapper } from './request-mapper';

/** Endpoints que solo reciben :uid (aprobar, recibir, movimientos). */
export class UidParamMapper extends BaseRequestMapper<string> {
  public map(req: Request): string {
    return this.requireString(req.params.uid, 'uid');
  }
}
