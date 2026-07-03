import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { IInventoryMovementRepository } from '../../domain/ports/inventory-movement.repository';

/** Caso de uso de UN repositorio (movements): historial por producto (RF-02). */
export class ListMovementsByProductUseCase {
  constructor(private readonly movements: IInventoryMovementRepository) {}

  public execute(productId: number): Promise<InventoryMovement[]> {
    return this.movements.findByProductId(productId);
  }
}
