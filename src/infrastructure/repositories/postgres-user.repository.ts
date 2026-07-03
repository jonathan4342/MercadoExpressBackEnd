import { injectable } from 'inversify';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/user.repository';
import { Queryable } from '../database/queryable';

@injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: Queryable) {}

  /** La comparación bcrypt ocurre EN la BD (pgcrypto): el hash nunca viaja a la app. */
  public async findByCredentials(username: string, password: string): Promise<User | null> {
    const { rows } = await this.db.query(
      `SELECT id, uid, username, role
       FROM users
       WHERE username = $1
         AND password_hash = crypt($2, password_hash)`,
      [username, password]
    );
    return rows[0] ? User.restore(rows[0]) : null;
  }
}
