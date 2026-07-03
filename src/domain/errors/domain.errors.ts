export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Datos de entrada inválidos → HTTP 400 */
export class ValidationError extends DomainError {}

/** Recurso inexistente → HTTP 404 */
export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} con id '${id}' no encontrado`);
  }
}

/** Conflicto de estado o unicidad (SKU duplicado, transición inválida, alerta duplicada) → HTTP 409 */
export class ConflictError extends DomainError {}

/** Regla 1: stock insuficiente → HTTP 422 */
export class InsufficientStockError extends DomainError {
  constructor(public readonly available: number, public readonly requested: number) {
    super(
      `Stock insuficiente: hay ${available} unidades y se intentó retirar ${requested}. ` +
      `Faltan ${requested - available} unidades.`
    );
  }
}

/** Credenciales inválidas o token ausente/expirado → HTTP 401 */
export class UnauthorizedError extends DomainError {
  constructor(message = 'No autorizado.') {
    super(message);
  }
}
