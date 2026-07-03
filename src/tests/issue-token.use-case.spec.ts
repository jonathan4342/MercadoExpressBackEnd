import 'reflect-metadata';
import { IssueTokenUseCase } from '../application/use-cases/issue-token.use-case';
import { User } from '../domain/entities/user.entity';
import { UnauthorizedError } from '../domain/errors/domain.errors';
import { AuthToken, ITokenService, TokenPayload } from '../domain/ports/token-service';
import { IUserRepository } from '../domain/ports/user.repository';

const admin = User.restore({ id: 1, uid: 'uid-admin', username: 'admin', role: 'ADMIN' });

class FakeUsers implements IUserRepository {
  async findByCredentials(username: string, password: string): Promise<User | null> {
    return username === 'admin' && password === 'Admin123*' ? admin : null;
  }
}

class FakeTokens implements ITokenService {
  issue(user: User): AuthToken {
    return { accessToken: `token-de-${user.username}`, tokenType: 'Bearer', expiresIn: 3600 };
  }
  verify(): TokenPayload { return { sub: 'admin', uid: 'uid-admin', role: 'ADMIN' }; }
}

describe('IssueTokenUseCase (POST /api/auth/token)', () => {
  const useCase = new IssueTokenUseCase(new FakeUsers(), new FakeTokens());

  it('emite el token con credenciales válidas', async () => {
    const token = await useCase.execute('admin', 'Admin123*');
    expect(token.accessToken).toBe('token-de-admin');
    expect(token.tokenType).toBe('Bearer');
    expect(token.expiresIn).toBe(3600);
  });

  it('rechaza clave incorrecta con UnauthorizedError (401)', async () => {
    await expect(useCase.execute('admin', 'otra-clave')).rejects.toThrow(UnauthorizedError);
  });

  it('rechaza usuario inexistente sin revelar cuál dato falló', async () => {
    await expect(useCase.execute('hacker', 'Admin123*'))
      .rejects.toThrow('Usuario o clave incorrectos.');
  });
});
