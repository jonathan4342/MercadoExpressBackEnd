import { AlertEvent } from '../events/alert-event';

/** Puerto de salida: difundir eventos de alerta a los clientes conectados. */
export interface IAlertBroadcaster {
  broadcast(event: AlertEvent): void;
}
