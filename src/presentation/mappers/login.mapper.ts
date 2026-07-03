import { Request } from 'express';
import { BaseRequestMapper } from './request-mapper';

export interface LoginRequest {
  username: string;
  password: string;
}

/** POST /auth/token */
export class LoginMapper extends BaseRequestMapper<LoginRequest> {
  public map(req: Request): LoginRequest {
    const b = req.body ?? {};
    return {
      username: this.requireString(b.username, 'username'),
      password: this.requireString(b.password, 'password')
    };
  }
}
