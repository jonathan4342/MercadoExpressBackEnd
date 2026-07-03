import { User } from '../entities/user.entity';

export interface IUserRepository {
  /** Devuelve el usuario solo si las credenciales son correctas (bcrypt en la BD). */
  findByCredentials(username: string, password: string): Promise<User | null>;
}
