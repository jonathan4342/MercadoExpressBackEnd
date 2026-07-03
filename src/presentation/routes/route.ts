import { Router } from 'express';
import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import { ITokenService } from '../../domain/ports/token-service';
import { authGuard } from '../middlewares/auth.middleware';
import { buildAlertRouter } from './alert.route';
import { buildAuthRouter } from './auth.route';
import { buildOrderRouter } from './order.route';
import { buildProductRouter } from './product.route';

/**
 * Router raíz. Públicos: /health y /auth/token.
 * Todo lo demás pasa por el guard JWT.
 */
export function buildRouter(container: Container): Router {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));
  router.use('/auth', buildAuthRouter(container));

  const guard = authGuard(container.get<ITokenService>(TYPES.TokenService));
  router.use('/products', guard, buildProductRouter(container));
  router.use('/alerts', guard, buildAlertRouter(container));
  router.use('/orders', guard, buildOrderRouter(container));

  return router;
}
