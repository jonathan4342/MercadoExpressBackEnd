import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import { Container } from 'inversify';
import { errorHandler } from './middlewares/error-handler.middleware';
import { buildRouter } from './routes/route';

/** Adaptador HTTP: seguridad, parsing y montaje de las rutas de presentation. */
export class ExpressServer {
  private readonly app: Application;

  constructor(private readonly container: Container) {
    this.app = express();
    this.app.use(helmet());
    this.app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
    this.app.use(express.json());
    this.app.use('/api', buildRouter(this.container));
    this.app.use(errorHandler);
  }

  public listen(port: number): void {
    this.app.listen(port, () => console.log(`API escuchando en http://localhost:${port}/api`));
  }

  /** Para tests de integración con supertest. */
  public getApp(): Application { return this.app; }
}
