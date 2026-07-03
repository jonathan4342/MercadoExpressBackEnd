import { User } from '../entities/user.entity';

export interface TokenPayload {
  /** username del usuario autenticado (se usa como actor de auditoría). */
  sub: string;
  uid: string;
  role: string;
}

export interface AuthToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // segundos
}

/** Puerto: emisión y verificación de tokens (el adaptador decide la tecnología, ej. JWT). */
export interface ITokenService {
  issue(user: User): AuthToken;
  /** Lanza UnauthorizedError si el token es inválido o expiró. */
  verify(token: string): TokenPayload;
}
