import { Router } from 'express';
import { Container } from 'inversify';
import { IssueTokenController } from '../controllers/auth/issue-token.controller';
import { LoginMapper } from '../mappers/login.mapper';
import { validate } from '../middlewares/validate.middleware';

/** Rutas de autenticación (públicas). */
export function buildAuthRouter(container: Container): Router {
  const router = Router();

  router.post('/token',
    validate(new LoginMapper()),
    container.resolve(IssueTokenController).handle);

  return router;
}
