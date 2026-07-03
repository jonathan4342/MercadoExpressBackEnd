import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Alert } from '../../domain/entities/alert.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { Product } from '../../domain/entities/product.entity';
import { IUnitOfWork } from '../../domain/ports/unit-of-work';
import { StockAdjustment } from '../../domain/value-objects/stock-adjustment.vo';
import { GetActiveAlertUseCase } from '../use-cases/get-active-alert.use-case';
import { RecordMovementUseCase } from '../use-cases/record-movement.use-case';
import { UpdateProductStockUseCase } from '../use-cases/update-product-stock.use-case';

export interface AdjustStockResult {
  product: Product;
  movement: InventoryMovement;
  /** Creada/resuelta por el trigger de la BD; aquí solo se consulta el estado final. */
  alert: Alert | null;
}

/**
 * Servicio de aplicación (RF-02 + RF-03): orquesta tres casos de uso —
 * cada uno con su único repositorio — en UNA transacción con actor de auditoría.
 * Entrada: primitivos + el VO de dominio StockAdjustment (sin DTOs).
 */
@injectable()
export class AdjustStockService {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly uow: IUnitOfWork
  ) {}

  public execute(productUid: string, adjustment: StockAdjustment, actor: string): Promise<AdjustStockResult> {
    return this.uow.execute(async (repos) => {
      const product = await new UpdateProductStockUseCase(repos.products)
        .execute({ productUid }, adjustment);

      const movement = await new RecordMovementUseCase(repos.movements)
        .execute(product.id, adjustment, product.currentStock);

      const alert = await new GetActiveAlertUseCase(repos.alerts).execute(product.id);

      return { product, movement, alert };
    }, { actor });
  }
}
