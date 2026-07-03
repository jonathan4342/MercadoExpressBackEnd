import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { Supplier } from '../../domain/entities/supplier.entity';
import { ISupplierRepository } from '../../domain/ports/supplier.repository';

/** Catálogo para el select de proveedores del front. */
@injectable()
export class ListSuppliersUseCase {
  constructor(
    @inject(TYPES.SupplierRepository) private readonly suppliers: ISupplierRepository
  ) {}

  public execute(): Promise<Supplier[]> {
    return this.suppliers.findAll();
  }
}
