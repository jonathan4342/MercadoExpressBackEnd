import { InventoryMovement } from '../entities/inventory-movement.entity';

/** Solo agregar y leer: el historial es inmutable (Regla 6). */
export interface IInventoryMovementRepository {
  append(movement: InventoryMovement): Promise<InventoryMovement>;
  findByProductId(productId: number): Promise<InventoryMovement[]>;
}
