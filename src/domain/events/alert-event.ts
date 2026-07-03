export type AlertEventType = 'CREADA' | 'RESUELTA';

/** Evento de dominio emitido por la BD (pg_notify) cuando una alerta cambia. */
export interface AlertEvent {
  event: AlertEventType;
  alertUid: string;
  productUid: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  occurredAt: string;
}
