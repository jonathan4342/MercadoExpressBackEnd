import { IAlertRepository } from './alert.repository';
import { IInventoryMovementRepository } from './inventory-movement.repository';
import { IProductRepository } from './product.repository';
import { IPurchaseOrderRepository } from './purchase-order.repository';

export interface RepositoryContext {
  products: IProductRepository;
  movements: IInventoryMovementRepository;
  alerts: IAlertRepository;
  orders: IPurchaseOrderRepository;
}

export interface UnitOfWorkOptions {
  /** Usuario responsable del cambio; queda en changed_by de las tablas *_audit. */
  actor?: string;
}

/**
 * Unidad de Trabajo: atomicidad para operaciones multi-agregado y propagación
 * del actor de auditoría a la transacción (set_config app.current_user).
 */
export interface IUnitOfWork {
  execute<T>(
    work: (repos: RepositoryContext) => Promise<T>,
    options?: UnitOfWorkOptions
  ): Promise<T>;
}
