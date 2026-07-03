import { Alert, AlertStatus } from '../entities/alert.entity';

/** Solo lectura: el ciclo de vida de las alertas lo maneja el trigger de la BD. */
export interface IAlertRepository {
  findByUid(uid: string): Promise<Alert | null>;
  findActiveByProductId(productId: number): Promise<Alert | null>;
  findAll(status?: AlertStatus): Promise<Alert[]>;
}
