import { Alert } from '../../domain/entities/alert.entity';
import { IAlertRepository } from '../../domain/ports/alert.repository';

/** Caso de uso de UN repositorio (alerts): alerta ACTIVA de un producto, si existe. */
export class GetActiveAlertUseCase {
  constructor(private readonly alerts: IAlertRepository) {}

  public execute(productId: number): Promise<Alert | null> {
    return this.alerts.findActiveByProductId(productId);
  }
}
