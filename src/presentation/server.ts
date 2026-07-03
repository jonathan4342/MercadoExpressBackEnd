import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import http from 'http';
import { Container } from 'inversify';
import { Server as SocketIoServer } from 'socket.io';
import { ListAlertsUseCase } from '../application/use-cases/list-alerts.use-case';
import { ITokenService } from '../domain/ports/token-service';
import { AlertStatus } from '../domain/entities/alert.entity';
import { TYPES } from '../container/types';
import { SocketIoAlertBroadcaster } from '../infrastructure/websocket/socketio-alert-broadcaster';
import { errorHandler } from './middlewares/error-handler.middleware';
import { AlertResponseMapper } from './mappers/response.mappers';
import { buildRouter } from './routes/route';

/** Adaptador HTTP + WebSocket: REST bajo /api y tiempo real en el namespace /alerts. */
export class ExpressServer {
  private readonly app: Application;
  private readonly httpServer: http.Server;
  private readonly io: SocketIoServer;

  constructor(private readonly container: Container) {
    const corsOrigin = process.env.CORS_ORIGIN?.split(',') ?? '*';

    this.app = express();
    this.app.use(helmet());
    this.app.use(cors({ origin: corsOrigin }));
    this.app.use(express.json());
    this.app.use('/api', buildRouter(this.container));
    this.app.use(errorHandler);

    this.httpServer = http.createServer(this.app);
    this.io = new SocketIoServer(this.httpServer, { cors: { origin: corsOrigin } });
    this.setupAlertsNamespace();
  }

  /** ws://host/alerts — el front recibe 'alerts:init' al conectar y 'alert' en vivo. */
  private setupAlertsNamespace(): void {
    const namespace = this.io.of('/alerts');

    // Seguridad: el handshake exige un token válido (auth: { token })
    const tokens = this.container.get<ITokenService>(TYPES.TokenService);
    namespace.use((socket, next) => {
      try {
        tokens.verify(String(socket.handshake.auth?.token ?? ''));
        next();
      } catch {
        next(new Error('No autorizado: token requerido en el handshake.'));
      }
    });

    // El adaptador del puerto IAlertBroadcaster emite sobre este namespace
    this.container.get<SocketIoAlertBroadcaster>(TYPES.AlertBroadcaster).attach(namespace);

    const listAlerts = this.container.get<ListAlertsUseCase>(TYPES.ListAlertsUseCase);
    namespace.on('connection', async (socket) => {
      try {
        const active = await listAlerts.execute(AlertStatus.ACTIVA);
        socket.emit('alerts:init', active.map(AlertResponseMapper.toDto));
      } catch (err) {
        console.error('[WS] error enviando snapshot inicial', err);
      }
    });
  }

  public listen(port: number): void {
    this.httpServer.listen(port, () => {
      console.log(`API escuchando en http://localhost:${port}/api`);
      console.log(`WebSocket de alertas en ws://localhost:${port}/alerts`);
    });
  }

  /** Para tests de integración con supertest. */
  public getApp(): Application { return this.app; }
}
