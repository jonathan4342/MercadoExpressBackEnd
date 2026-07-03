import { Alert } from '../../domain/entities/alert.entity';
import { NotFoundError } from '../../domain/errors/domain.errors';
import { IAlertRepository } from '../../domain/ports/alert.repository';

/** Caso de uso de UN repositorio (alerts): localizar una alerta por uid. */
export class GetAlertByUidUseCase {
  constructor(private readonly alerts: IAlertRepository) {}

  public async execute(alertUid: string): Promise<Alert> {
    const alert = await this.alerts.findByUid(alertUid);
    if (!alert) throw new NotFoundError('Alerta', alertUid);
    return alert;
  }
}
