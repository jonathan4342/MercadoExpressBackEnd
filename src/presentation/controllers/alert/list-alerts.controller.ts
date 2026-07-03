import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { ListAlertsUseCase } from '../../../application/use-cases/list-alerts.use-case';
import { AlertStatus } from '../../../domain/entities/alert.entity';
import { AlertResponseMapper } from '../../mappers/response.mappers';

/** GET /api/alerts — RF-03. */
@injectable()
export class ListAlertsController {
  constructor(
    @inject(TYPES.ListAlertsUseCase) private readonly useCase: ListAlertsUseCase
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = res.locals.dto as AlertStatus | undefined;
      const alerts = await this.useCase.execute(status);
      res.json(alerts.map(AlertResponseMapper.toDto));
    } catch (e) { next(e); }
  };
}
