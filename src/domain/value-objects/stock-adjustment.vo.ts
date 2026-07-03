import { MovementType } from '../entities/inventory-movement.entity';
import { ValidationError } from '../errors/domain.errors';

/**
 * Value Object: un ajuste de inventario válido (RF-02).
 * Encapsula sus invariantes: tipo permitido, cantidad entera positiva y motivo obligatorio.
 * Es lo que cruza del controlador hacia las capas internas (nunca un DTO).
 */
export class StockAdjustment {
  private constructor(
    public readonly type: MovementType,
    public readonly quantity: number,
    public readonly reason: string
  ) {}

  public static create(props: { type: MovementType; quantity: number; reason: string }): StockAdjustment {
    if (!Object.values(MovementType).includes(props.type)) {
      throw new ValidationError(
        `Tipo de movimiento inválido: debe ser ${Object.values(MovementType).join(' o ')}.`
      );
    }
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new ValidationError('La cantidad del ajuste debe ser un entero mayor a 0.');
    }
    if (!props.reason?.trim()) {
      throw new ValidationError('El motivo del ajuste es obligatorio.');
    }
    return new StockAdjustment(props.type, props.quantity, props.reason.trim());
  }
}
