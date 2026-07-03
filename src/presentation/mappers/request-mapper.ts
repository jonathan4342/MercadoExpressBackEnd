import { Request } from 'express';
import { ValidationError } from '../../domain/errors/domain.errors';

/**
 * Contrato de los mappers de entrada (principio I): cada endpoint tiene un mapper
 * que "une" (join) las partes del request — params + query + body — y las convierte
 * en un DTO tipado, validando que los datos cumplan lo requerido.
 * Se ejecuta en el middleware validate() ANTES de llegar al controlador.
 */
export interface IRequestMapper<T> {
  map(req: Request): T;
}

/** Clase base: helpers de validación compartidos (principio O: se extiende, no se modifica). */
export abstract class BaseRequestMapper<T> implements IRequestMapper<T> {
  public abstract map(req: Request): T;

  protected requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError(`El campo '${field}' es obligatorio y debe ser texto.`);
    }
    return value.trim();
  }

  protected optionalString(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return this.requireString(value, field);
  }

  protected requireNumber(value: unknown, field: string): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new ValidationError(`El campo '${field}' es obligatorio y debe ser numérico.`);
    }
    return value;
  }

  protected optionalNumber(value: unknown, field: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || Number.isNaN(n)) {
      throw new ValidationError(`El campo '${field}' debe ser numérico.`);
    }
    return n;
  }

  protected requireEnum<E extends string>(value: unknown, allowed: readonly E[], field: string): E {
    if (typeof value !== 'string' || !allowed.includes(value as E)) {
      throw new ValidationError(
        `El campo '${field}' es obligatorio y debe ser uno de: ${allowed.join(', ')}.`
      );
    }
    return value as E;
  }

  protected optionalEnum<E extends string>(
    value: unknown, allowed: readonly E[], field: string
  ): E | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return this.requireEnum(value, allowed, field);
  }
}
