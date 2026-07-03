import { AlertEvent } from '../../domain/events/alert-event';
import { IAlertBroadcaster } from '../../domain/ports/alert-broadcaster';

/** Caso de uso de UN puerto: retransmite el evento de alerta al front (RF-03 en tiempo real). */
export class BroadcastAlertEventUseCase {
  constructor(private readonly broadcaster: IAlertBroadcaster) {}

  public execute(event: AlertEvent): void {
    this.broadcaster.broadcast(event);
  }
}
