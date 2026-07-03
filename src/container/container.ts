import { Container } from 'inversify';
import { Pool } from 'pg';
import { AdjustStockService } from '../application/services/adjust-stock.service';
import { CreateOrderService } from '../application/services/create-order.service';
import { ListProductMovementsService } from '../application/services/list-product-movements.service';
import { ReceiveOrderService } from '../application/services/receive-order.service';
import { ApproveOrderUseCase } from '../application/use-cases/approve-order.use-case';
import { BroadcastAlertEventUseCase } from '../application/use-cases/broadcast-alert-event.use-case';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { IssueTokenUseCase } from '../application/use-cases/issue-token.use-case';
import { ListAlertsUseCase } from '../application/use-cases/list-alerts.use-case';
import { ListInventoryUseCase } from '../application/use-cases/list-inventory.use-case';
import { ListOrdersUseCase } from '../application/use-cases/list-orders.use-case';
import { RejectOrderUseCase } from '../application/use-cases/reject-order.use-case';
import { IAlertRepository } from '../domain/ports/alert.repository';
import { IInventoryMovementRepository } from '../domain/ports/inventory-movement.repository';
import { IProductRepository } from '../domain/ports/product.repository';
import { IPurchaseOrderRepository } from '../domain/ports/purchase-order.repository';
import { IUnitOfWork } from '../domain/ports/unit-of-work';
import { PostgresPoolFactory } from '../infrastructure/database/postgres-pool';
import { PostgresUnitOfWork } from '../infrastructure/database/postgres-unit-of-work';
import { PostgresAlertListener } from '../infrastructure/database/postgres-alert-listener';
import { PostgresAlertRepository } from '../infrastructure/repositories/postgres-alert.repository';
import { PostgresMovementRepository } from '../infrastructure/repositories/postgres-movement.repository';
import { PostgresOrderRepository } from '../infrastructure/repositories/postgres-order.repository';
import { PostgresProductRepository } from '../infrastructure/repositories/postgres-product.repository';
import { IAlertBroadcaster } from '../domain/ports/alert-broadcaster';
import { ITokenService } from '../domain/ports/token-service';
import { IUserRepository } from '../domain/ports/user.repository';
import { PostgresUserRepository } from '../infrastructure/repositories/postgres-user.repository';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import { SocketIoAlertBroadcaster } from '../infrastructure/websocket/socketio-alert-broadcaster';
import { TYPES } from './types';

/** Composition Root: contratos (puertos) → implementaciones (adaptadores). */
export function buildContainer(): Container {
  const container = new Container({ defaultScope: 'Singleton' });

  // Infraestructura
  container.bind<Pool>(TYPES.DatabasePool).toDynamicValue(() => PostgresPoolFactory.create());
  container.bind<IUnitOfWork>(TYPES.UnitOfWork).toDynamicValue(
    (ctx) => new PostgresUnitOfWork(ctx.container.get<Pool>(TYPES.DatabasePool))
  );

  // Repositorios (lecturas fuera de transacción usan el pool)
  container.bind<IProductRepository>(TYPES.ProductRepository).toDynamicValue(
    (ctx) => new PostgresProductRepository(ctx.container.get<Pool>(TYPES.DatabasePool))
  );
  container.bind<IInventoryMovementRepository>(TYPES.MovementRepository).toDynamicValue(
    (ctx) => new PostgresMovementRepository(ctx.container.get<Pool>(TYPES.DatabasePool))
  );
  container.bind<IAlertRepository>(TYPES.AlertRepository).toDynamicValue(
    (ctx) => new PostgresAlertRepository(ctx.container.get<Pool>(TYPES.DatabasePool))
  );
  container.bind<IPurchaseOrderRepository>(TYPES.OrderRepository).toDynamicValue(
    (ctx) => new PostgresOrderRepository(ctx.container.get<Pool>(TYPES.DatabasePool))
  );

  // Casos de uso de un solo repositorio
  container.bind(TYPES.CreateProductUseCase).to(CreateProductUseCase);
  container.bind(TYPES.ListInventoryUseCase).to(ListInventoryUseCase);
  container.bind(TYPES.ListAlertsUseCase).to(ListAlertsUseCase);
  container.bind(TYPES.ListOrdersUseCase).to(ListOrdersUseCase);
  container.bind(TYPES.ApproveOrderUseCase).to(ApproveOrderUseCase);
  container.bind(TYPES.RejectOrderUseCase).to(RejectOrderUseCase);

  // Seguridad: repo de usuarios + servicio de tokens + caso de uso de login
  container.bind<IUserRepository>(TYPES.UserRepository).toDynamicValue(
    (ctx) => new PostgresUserRepository(ctx.container.get<Pool>(TYPES.DatabasePool))
  );
  container.bind<ITokenService>(TYPES.TokenService).toDynamicValue(
    () => new JwtTokenService(
      process.env.JWT_SECRET ?? 'dev-secret-cambiar-en-produccion',
      Number(process.env.JWT_EXPIRES_IN ?? 3600)
    )
  );
  container.bind(TYPES.IssueTokenUseCase).toDynamicValue(
    (ctx) => new IssueTokenUseCase(
      ctx.container.get<IUserRepository>(TYPES.UserRepository),
      ctx.container.get<ITokenService>(TYPES.TokenService)
    )
  );

  // Tiempo real: puerto de difusión + caso de uso + listener LISTEN/NOTIFY
  container.bind<IAlertBroadcaster>(TYPES.AlertBroadcaster).to(SocketIoAlertBroadcaster);
  container.bind(TYPES.BroadcastAlertEventUseCase).toDynamicValue(
    (ctx) => new BroadcastAlertEventUseCase(ctx.container.get<IAlertBroadcaster>(TYPES.AlertBroadcaster))
  );
  container.bind(TYPES.AlertEventListener).toDynamicValue(
    (ctx) => new PostgresAlertListener(
      process.env.DATABASE_URL,
      ctx.container.get<BroadcastAlertEventUseCase>(TYPES.BroadcastAlertEventUseCase)
    )
  );

  // Servicios de aplicación
  container.bind(TYPES.AdjustStockService).to(AdjustStockService);
  container.bind(TYPES.ListProductMovementsService).to(ListProductMovementsService);
  container.bind(TYPES.CreateOrderService).to(CreateOrderService);
  container.bind(TYPES.ReceiveOrderService).to(ReceiveOrderService);

  return container;
}
