import { Request } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/** Actor de auditoría (changed_by): el username del token JWT verificado. */
export class ActorMapper {
  public static from(req: Request): string {
    return (req as AuthenticatedRequest).user?.sub ?? 'api';
  }
}
