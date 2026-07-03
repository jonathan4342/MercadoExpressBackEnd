import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Category } from '../../domain/entities/category.entity';
import { ICategoryRepository } from '../../domain/ports/category.repository';

/** Catálogo para el select de categorías del front. */
@injectable()
export class ListCategoriesUseCase {
  constructor(
    @inject(TYPES.CategoryRepository) private readonly categories: ICategoryRepository
  ) {}

  public execute(): Promise<Category[]> {
    return this.categories.findAll();
  }
}
