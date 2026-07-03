import { Client } from 'pg';
import { BroadcastAlertEventUseCase } from '../../application/use-cases/broadcast-alert-event.use-case';
import { AlertEvent } from '../../domain/events/alert-event';

/**
 * Adaptador de entrada: conexión dedicada con LISTEN alert_events.
 * El trigger manage_stock_alerts hace pg_notify al crear/resolver alertas
 * (solo si la transacción hace COMMIT) y aquí se retransmite vía el caso de uso.
 */
export class PostgresAlertListener {
  private static readonly CHANNEL = 'alert_events';
  private static readonly RETRY_MS = 5000;
  private client: Client | null = null;

  constructor(
    private readonly connectionString: string | undefined,
    private readonly broadcastEvent: BroadcastAlertEventUseCase
  ) {}

  public async start(): Promise<void> {
    this.client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

    this.client.on('error', (err) => {
      console.error('[AlertListener] conexión perdida, reintentando...', err.message);
      this.scheduleReconnect();
    });

    this.client.on('notification', (msg) => {
      if (!msg.payload) return;
      try {
        this.broadcastEvent.execute(JSON.parse(msg.payload) as AlertEvent);
      } catch (err) {
        console.error('[AlertListener] payload inválido:', msg.payload, err);
      }
    });

    await this.client.connect();
    await this.client.query(`LISTEN ${PostgresAlertListener.CHANNEL}`);
    console.log(`[AlertListener] escuchando canal '${PostgresAlertListener.CHANNEL}'`);
  }

  private scheduleReconnect(): void {
    setTimeout(() => this.start().catch((e) =>
      console.error('[AlertListener] reintento fallido', e.message)
    ), PostgresAlertListener.RETRY_MS);
  }

  public async stop(): Promise<void> {
    await this.client?.end();
    this.client = null;
  }
}
