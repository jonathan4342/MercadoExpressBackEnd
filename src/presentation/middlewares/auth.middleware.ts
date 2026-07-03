import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../domain/errors/domain.errors';
import { ITokenService, TokenPayload } from '../../domain/ports/token-service';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Guard de autenticación: exige 'Authorization: Bearer <token>' en TODOS los
 * endpoints de recursos. Deja el payload en req.user — de ahí sale el actor
 * de auditoría (changed_by).
 */
export function authGuard(tokens: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.header('authorization') ?? '';
      const [scheme, token] = header.split(' ');
      if (scheme?.toLowerCase() !== 'bearer' || !token) {
        throw new UnauthorizedError("Token requerido: use el header 'Authorization: Bearer <token>'.");
      }
      (req as AuthenticatedRequest).user = tokens.verify(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
