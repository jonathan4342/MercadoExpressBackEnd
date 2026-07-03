import { ValidationError } from '../errors/domain.errors';

export enum MovementType {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA'
}

/** Entidad inmutable (Regla 6). id/uid/createdAt los asigna la BD al insertar. */
export class InventoryMovement {
  private constructor(
    public readonly id: number | null,
    public readonly uid: string | null,
    public readonly productId: number,
    public readonly type: MovementType,
    public readonly quantity: number,
    public readonly reason: string,
    public readonly stockAfter: number,
    public readonly createdAt: Date | null
  ) {}

  public static create(props: {
    productId: number; type: MovementType; quantity: number; reason: string; stockAfter: number;
  }): InventoryMovement {
    if (!props.reason?.trim()) throw new ValidationError('El motivo del movimiento es obligatorio.');
    return new InventoryMovement(
      null, null, props.productId, props.type,
      props.quantity, props.reason.trim(), props.stockAfter, null
    );
  }

  public static restore(row: {
    id: number; uid: string; productId: number; type: MovementType;
    quantity: number; reason: string; stockAfter: number; createdAt: Date;
  }): InventoryMovement {
    return new InventoryMovement(
      row.id, row.uid, row.productId, row.type,
      row.quantity, row.reason, row.stockAfter, row.createdAt
    );
  }
}
