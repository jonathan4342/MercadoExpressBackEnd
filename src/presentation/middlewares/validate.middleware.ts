import { NextFunction, Request, Response } from 'express';
import { IRequestMapper } from '../mappers/request-mapper';

/**
 * Ejecuta el mapper del endpoint ANTES del controlador: si los datos no cumplen
 * lo requerido, el mapper lanza ValidationError (→ 400 en el error handler) y el
 * request nunca llega al caso de uso. El DTO tipado queda en res.locals.dto.
 */
export function validate<T>(mapper: IRequestMapper<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.locals.dto = mapper.map(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}
