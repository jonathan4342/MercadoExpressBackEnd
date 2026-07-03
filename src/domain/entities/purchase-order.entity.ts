import { ConflictError, ValidationError } from '../errors/domain.errors';

export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  RECIBIDA = 'RECIBIDA'
}

/** Entidad con máquina de estados (RF-04, RF-05, Reglas 2 y 5). */
export class PurchaseOrder {
  private constructor(
    private readonly _id: number | null,
    private readonly _uid: string | null,
    public readonly productId: number,
    public readonly supplier: string,
    public readonly alertId: number | null,
    public readonly quantity: number,
    private _status: OrderStatus,
    private _rejectionReason: string | null,
    public readonly createdAt: Date | null,
    private _approvedAt: Date | null,
    private _receivedAt: Date | null
  ) {}

  public static create(props: {
    productId: number; supplier: string; quantity: number;
    minimumOrderQuantity: number; alertId?: number | null;
  }): PurchaseOrder {
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new ValidationError('La cantidad de la orden debe ser un entero mayor a 0.');
    }
    if (props.quantity < props.minimumOrderQuantity) {
      throw new ValidationError(
        `La cantidad mínima de la orden es ${props.minimumOrderQuantity} unidades ` +
        `(2x el stock mínimo del producto).`
      );
    }
    return new PurchaseOrder(
      null, null, props.productId, props.supplier, props.alertId ?? null,
      props.quantity, OrderStatus.PENDIENTE, null, null, null, null
    );
  }

  public static restore(row: {
    id: number; uid: string; productId: number; supplier: string; alertId: number | null;
    quantity: number; status: OrderStatus; rejectionReason: string | null;
    createdAt: Date; approvedAt: Date | null; receivedAt: Date | null;
  }): PurchaseOrder {
    return new PurchaseOrder(
      row.id, row.uid, row.productId, row.supplier, row.alertId, row.quantity,
      row.status, row.rejectionReason, row.createdAt, row.approvedAt, row.receivedAt
    );
  }

  public isPersisted(): boolean { return this._id !== null; }

  get id(): number {
    if (this._id === null) throw new ValidationError('La orden aún no ha sido persistida.');
    return this._id;
  }

  get uid(): string {
    if (this._uid === null) throw new ValidationError('La orden aún no ha sido persistida.');
    return this._uid;
  }

  // ---------- Transiciones (RF-05, Regla 5) ----------
  public approve(): void {
    this.assertStatus(OrderStatus.PENDIENTE, 'aprobar');
    this._status = OrderStatus.APROBADA;
    this._approvedAt = new Date();
  }

  public reject(reason: string): void {
    this.assertStatus(OrderStatus.PENDIENTE, 'rechazar');
    if (!reason || reason.trim().length < 10) {
      throw new ValidationError('El motivo de rechazo es obligatorio (mínimo 10 caracteres).');
    }
    this._status = OrderStatus.RECHAZADA;
    this._rejectionReason = reason.trim();
  }

  public receive(): void {
    this.assertStatus(OrderStatus.APROBADA, 'recibir');
    this._status = OrderStatus.RECIBIDA;
    this._receivedAt = new Date();
  }

  private assertStatus(expected: OrderStatus, action: string): void {
    if (this._status !== expected) {
      throw new ConflictError(
        `No se puede ${action} una orden en estado ${this._status}; se requiere ${expected}.`
      );
    }
  }

  get status(): OrderStatus { return this._status; }
  get rejectionReason(): string | null { return this._rejectionReason; }
  get approvedAt(): Date | null { return this._approvedAt; }
  get receivedAt(): Date | null { return this._receivedAt; }
}
