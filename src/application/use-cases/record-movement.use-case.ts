import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { IInventoryMovementRepository } from '../../domain/ports/inventory-movement.repository';
import { StockAdjustment } from '../../domain/value-objects/stock-adjustment.vo';

/** Caso de uso de UN repositorio (movements): registra el movimiento inmutable (Regla 6). */
export class RecordMovementUseCase {
  constructor(private readonly movements: IInventoryMovementRepository) {}

  public execute(productId: number, adjustment: StockAdjustment, stockAfter: number): Promise<InventoryMovement> {
    return this.movements.append(InventoryMovement.create({
      productId,
      type: adjustment.type,
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      stockAfter
    }));
  }
}
