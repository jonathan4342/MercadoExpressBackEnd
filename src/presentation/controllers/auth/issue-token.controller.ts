import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../container/types';
import { IssueTokenUseCase } from '../../../application/use-cases/issue-token.use-case';
import { LoginRequest } from '../../mappers/login.mapper';

/** POST /api/auth/token — único endpoint público (además de /health). */
@injectable()
export class IssueTokenController {
  constructor(
    @inject(TYPES.IssueTokenUseCase) private readonly useCase: IssueTokenUseCase
  ) {}

  public handle = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = res.locals.dto as LoginRequest;
      res.json(await this.useCase.execute(username, password));
    } catch (e) { next(e); }
  };
}
