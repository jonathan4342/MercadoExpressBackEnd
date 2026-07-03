import { Router } from 'express';
import { Container } from 'inversify';
import { ListSuppliersController } from '../controllers/catalog/list-suppliers.controller';

/** Rutas de proveedores (catálogo). */
export function buildSupplierRouter(container: Container): Router {
  const router = Router();
  router.get('/', container.resolve(ListSuppliersController).handle);
  return router;
}
