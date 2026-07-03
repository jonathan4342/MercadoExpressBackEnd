import { Supplier } from '../entities/supplier.entity';

export interface ISupplierRepository {
  findAll(): Promise<Supplier[]>;
}
