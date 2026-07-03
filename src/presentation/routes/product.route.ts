import { Router } from 'express';
import { Container } from 'inversify';
import { AdjustStockController } from '../controllers/product/adjust-stock.controller';
import { CreateProductController } from '../controllers/product/create-product.controller';
import { ListInventoryController } from '../controllers/product/list-inventory.controller';
import { ListMovementsController } from '../controllers/product/list-movements.controller';
import { AdjustStockMapper } from '../mappers/adjust-stock.mapper';
import { CreateProductMapper } from '../mappers/create-product.mapper';
import { InventoryQueryMapper } from '../mappers/inventory-query.mapper';
import { UidParamMapper } from '../mappers/uid-param.mapper';
import { validate } from '../middlewares/validate.middleware';

export function buildProductRouter(container: Container): Router {
  const router = Router();

  router.post('/',
    validate(new CreateProductMapper()),
    container.resolve(CreateProductController).handle);

  router.get('/',
    validate(new InventoryQueryMapper()),
    container.resolve(ListInventoryController).handle);

  router.post('/:uid/adjustments',
    validate(new AdjustStockMapper()),
    container.resolve(AdjustStockController).handle);

  router.get('/:uid/movements',
    validate(new UidParamMapper()),
    container.resolve(ListMovementsController).handle);

  return router;
}
