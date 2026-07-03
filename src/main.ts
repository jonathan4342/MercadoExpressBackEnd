import 'reflect-metadata';
import dotenv from 'dotenv';
import { buildContainer } from './container/container';
import { TYPES } from './container/types';
import { PostgresAlertListener } from './infrastructure/database/postgres-alert-listener';
import { ExpressServer } from './presentation/server';

dotenv.config();

const container = buildContainer();
const server = new ExpressServer(container);
server.listen(Number(process.env.PORT ?? 3000));

// Tiempo real: escucha pg_notify('alert_events') y lo retransmite por Socket.IO
container.get<PostgresAlertListener>(TYPES.AlertEventListener)
  .start()
  .catch((err) => console.error('[AlertListener] no se pudo iniciar', err.message));
