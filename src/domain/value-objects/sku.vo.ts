import { ValidationError } from '../errors/domain.errors';

/** Value Object: encapsula el formato del SKU (alfanumérico, 6-20 caracteres). */
export class Sku {
  private static readonly PATTERN = /^[A-Za-z0-9]{6,20}$/;

  private constructor(public readonly value: string) {}

  public static create(raw: string): Sku {
    const value = (raw ?? '').trim().toUpperCase();
    if (!Sku.PATTERN.test(value)) {
      throw new ValidationError(
        `SKU inválido: '${raw}'. Debe ser alfanumérico de 6 a 20 caracteres.`
      );
    }
    return new Sku(value);
  }

  public equals(other: Sku): boolean {
    return this.value === other.value;
  }
}
