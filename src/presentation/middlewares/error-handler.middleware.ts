import { NextFunction, Request, Response } from 'express';
import {
  ConflictError, DomainError, InsufficientStockError, NotFoundError, UnauthorizedError, ValidationError
} from '../../domain/errors/domain.errors';

/** Traduce errores de dominio a códigos HTTP. */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof UnauthorizedError)      { res.status(401).json(body(err)); return; }
  if (err instanceof ValidationError)        { res.status(400).json(body(err)); return; }
  if (err instanceof NotFoundError)          { res.status(404).json(body(err)); return; }
  if (err instanceof ConflictError)          { res.status(409).json(body(err)); return; }
  if (err instanceof InsufficientStockError) { res.status(422).json(body(err)); return; }
  if (err instanceof DomainError)            { res.status(400).json(body(err)); return; }

  console.error('[ERROR NO CONTROLADO]', err);
  res.status(500).json({ error: 'InternalServerError', message: 'Error interno del servidor' });
}

function body(err: DomainError) {
  return { error: err.name, message: err.message };
}
