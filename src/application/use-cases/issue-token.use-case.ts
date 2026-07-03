import { UnauthorizedError } from '../../domain/errors/domain.errors';
import { AuthToken, ITokenService } from '../../domain/ports/token-service';
import { IUserRepository } from '../../domain/ports/user.repository';

/**
 * Autenticación: valida credenciales contra la BD (UN repositorio) y emite
 * el token por el puerto ITokenService. El mensaje de error no revela si
 * falló el usuario o la clave.
 */
export class IssueTokenUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly tokens: ITokenService
  ) {}

  public async execute(username: string, password: string): Promise<AuthToken> {
    const user = await this.users.findByCredentials(username, password);
    if (!user) throw new UnauthorizedError('Usuario o clave incorrectos.');
    return this.tokens.issue(user);
  }
}
