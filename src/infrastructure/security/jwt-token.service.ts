import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/user.entity';
import { UnauthorizedError } from '../../domain/errors/domain.errors';
import { AuthToken, ITokenService, TokenPayload } from '../../domain/ports/token-service';

/** Adaptador JWT del puerto ITokenService (HS256, expiración configurable). */
@injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number
  ) {}

  public issue(user: User): AuthToken {
    const payload: TokenPayload = { sub: user.username, uid: user.uid, role: user.role };
    const accessToken = jwt.sign(payload, this.secret, {
      expiresIn: this.expiresInSeconds,
      issuer: 'mercadoexpress-api'
    });
    return { accessToken, tokenType: 'Bearer', expiresIn: this.expiresInSeconds };
  }

  public verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { issuer: 'mercadoexpress-api' });
      const { sub, uid, role } = decoded as jwt.JwtPayload & TokenPayload;
      if (!sub || !uid) throw new Error('payload incompleto');
      return { sub, uid, role };
    } catch {
      throw new UnauthorizedError('Token inválido o expirado.');
    }
  }
}
