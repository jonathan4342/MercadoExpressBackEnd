import { Product } from '../entities/product.entity';

export interface InventoryFilters {
  category?: string;
  supplier?: string;
  activeAlert?: boolean;
  minStock?: number;
  maxStock?: number;
}

export interface IProductRepository {
  findByUid(uid: string): Promise<Product | null>;
  findByUidForUpdate(uid: string): Promise<Product | null>;
  findByIdForUpdate(id: number): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filters: InventoryFilters): Promise<Product[]>;
  /** INSERT si no está persistido (devuelve la entidad con id/uid de la BD); UPDATE si ya lo está. */
  save(product: Product): Promise<Product>;
}
