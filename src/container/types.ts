/** Símbolos de inyección: un identificador por contrato (puerto, servicio o caso de uso). */
export const TYPES = {
  // Infraestructura
  DatabasePool: Symbol.for('DatabasePool'),
  UnitOfWork: Symbol.for('UnitOfWork'),

  // Puertos (repositorios)
  ProductRepository: Symbol.for('ProductRepository'),
  MovementRepository: Symbol.for('MovementRepository'),
  AlertRepository: Symbol.for('AlertRepository'),
  OrderRepository: Symbol.for('OrderRepository'),

  // Casos de uso de un solo repositorio (consumidos directo por controladores)
  CreateProductUseCase: Symbol.for('CreateProductUseCase'),
  ListInventoryUseCase: Symbol.for('ListInventoryUseCase'),
  ListAlertsUseCase: Symbol.for('ListAlertsUseCase'),
  ListOrdersUseCase: Symbol.for('ListOrdersUseCase'),
  ApproveOrderUseCase: Symbol.for('ApproveOrderUseCase'),
  RejectOrderUseCase: Symbol.for('RejectOrderUseCase'),

  // Seguridad
  UserRepository: Symbol.for('UserRepository'),
  TokenService: Symbol.for('TokenService'),
  IssueTokenUseCase: Symbol.for('IssueTokenUseCase'),

  // Tiempo real (RF-03)
  AlertBroadcaster: Symbol.for('AlertBroadcaster'),
  BroadcastAlertEventUseCase: Symbol.for('BroadcastAlertEventUseCase'),
  AlertEventListener: Symbol.for('AlertEventListener'),

  // Servicios de aplicación (orquestan varios casos de uso)
  AdjustStockService: Symbol.for('AdjustStockService'),
  ListProductMovementsService: Symbol.for('ListProductMovementsService'),
  CreateOrderService: Symbol.for('CreateOrderService'),
  ReceiveOrderService: Symbol.for('ReceiveOrderService')
} as const;
