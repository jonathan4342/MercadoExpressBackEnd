import { injectable } from 'inversify';
import { Namespace } from 'socket.io';
import { AlertEvent } from '../../domain/events/alert-event';
import { IAlertBroadcaster } from '../../domain/ports/alert-broadcaster';

/**
 * Adaptador Socket.IO del puerto IAlertBroadcaster.
 * El servidor HTTP le "adjunta" el namespace /alerts al arrancar;
 * si aún no hay namespace, el broadcast es un no-op seguro.
 */
@injectable()
export class SocketIoAlertBroadcaster implements IAlertBroadcaster {
  private namespace: Namespace | null = null;

  public attach(namespace: Namespace): void {
    this.namespace = namespace;
  }

  public broadcast(event: AlertEvent): void {
    this.namespace?.emit('alert', event);
  }
}
