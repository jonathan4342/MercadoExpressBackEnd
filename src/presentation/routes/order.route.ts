import { Router } from 'express';
import { Container } from 'inversify';
import { ApproveOrderController } from '../controllers/order/approve-order.controller';
import { CreateOrderController } from '../controllers/order/create-order.controller';
import { ListOrdersController } from '../controllers/order/list-orders.controller';
import { ReceiveOrderController } from '../controllers/order/receive-order.controller';
import { RejectOrderController } from '../controllers/order/reject-order.controller';
import { CreateOrderMapper } from '../mappers/create-order.mapper';
import { RejectOrderMapper } from '../mappers/reject-order.mapper';
import { OrderStatusQueryMapper } from '../mappers/status-query.mapper';
import { UidParamMapper } from '../mappers/uid-param.mapper';
import { validate } from '../middlewares/validate.middleware';

/** Rutas de órdenes de compra — RF-04, RF-05. */
export function buildOrderRouter(container: Container): Router {
  const router = Router();

  router.post('/',
    validate(new CreateOrderMapper()),
    container.resolve(CreateOrderController).handle);

  router.get('/',
    validate(new OrderStatusQueryMapper()),
    container.resolve(ListOrdersController).handle);

  router.patch('/:uid/approve',
    validate(new UidParamMapper()),
    container.resolve(ApproveOrderController).handle);

  router.patch('/:uid/reject',
    validate(new RejectOrderMapper()),
    container.resolve(RejectOrderController).handle);

  router.patch('/:uid/receive',
    validate(new UidParamMapper()),
    container.resolve(ReceiveOrderController).handle);

  return router;
}
