import { Router } from 'express';
import { Container } from 'inversify';
import { ListCategoriesController } from '../controllers/catalog/list-categories.controller';

/** Rutas de categorías (catálogo). */
export function buildCategoryRouter(container: Container): Router {
  const router = Router();
  router.get('/', container.resolve(ListCategoriesController).handle);
  return router;
}
