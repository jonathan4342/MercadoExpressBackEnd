import { Router } from 'express';
import { Container } from 'inversify';
import { ListAlertsController } from '../controllers/alert/list-alerts.controller';
import { AlertStatusQueryMapper } from '../mappers/status-query.mapper';
import { validate } from '../middlewares/validate.middleware';

/** Rutas de alertas — RF-03. */
export function buildAlertRouter(container: Container): Router {
  const router = Router();

  router.get('/',
    validate(new AlertStatusQueryMapper()),
    container.resolve(ListAlertsController).handle);

  return router;
}
