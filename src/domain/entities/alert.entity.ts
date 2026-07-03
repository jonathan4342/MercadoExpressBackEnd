export enum AlertType { STOCK_BAJO = 'STOCK_BAJO' }
export enum AlertStatus { ACTIVA = 'ACTIVA', RESUELTA = 'RESUELTA' }

/**
 * Entidad de solo lectura en la aplicación: las alertas las crea y resuelve
 * el trigger trg_products_stock_alerts en la base de datos (RF-03, Reglas 3 y 4).
 */
export class Alert {
  private constructor(
    public readonly id: number,
    public readonly uid: string,
    public readonly productId: number,
    public readonly productUid: string,
    public readonly type: AlertType,
    public readonly status: AlertStatus,
    public readonly createdAt: Date,
    public readonly resolvedAt: Date | null
  ) {}

  public static restore(row: {
    id: number; uid: string; productId: number; productUid: string; type: AlertType;
    status: AlertStatus; createdAt: Date; resolvedAt: Date | null;
  }): Alert {
    return new Alert(
      row.id, row.uid, row.productId, row.productUid, row.type,
      row.status, row.createdAt, row.resolvedAt
    );
  }

  public isActive(): boolean { return this.status === AlertStatus.ACTIVA; }
}
