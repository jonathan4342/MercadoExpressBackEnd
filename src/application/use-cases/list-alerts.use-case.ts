import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Alert, AlertStatus } from '../../domain/entities/alert.entity';
import { IAlertRepository } from '../../domain/ports/alert.repository';

/** RF-03: consulta de alertas por estado. */
@injectable()
export class ListAlertsUseCase {
  constructor(
    @inject(TYPES.AlertRepository) private readonly alerts: IAlertRepository
  ) {}

  public execute(status?: AlertStatus): Promise<Alert[]> {
    return this.alerts.findAll(status);
  }
}
