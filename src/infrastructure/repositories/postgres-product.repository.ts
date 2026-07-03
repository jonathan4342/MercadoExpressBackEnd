import { injectable } from 'inversify';
import { Product } from '../../domain/entities/product.entity';
import { ValidationError } from '../../domain/errors/domain.errors';
import { IProductRepository, InventoryFilters } from '../../domain/ports/product.repository';
import { Queryable } from '../database/queryable';

const BASE_SELECT = `
  SELECT p.id, p.uid, p.sku, p.name,
         p.category_id, c.name AS category,
         p.price::float AS price, p.current_stock, p.minimum_stock,
         p.supplier_id, s.name AS supplier
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN suppliers  s ON s.id = p.supplier_id
`;

const FK_VIOLATION = '23503';

@injectable()
export class PostgresProductRepository implements IProductRepository {
  constructor(private readonly db: Queryable) {}

  public async findByUid(uid: string): Promise<Product | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE p.uid = $1`, [uid]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findByUidForUpdate(uid: string): Promise<Product | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE p.uid = $1 FOR UPDATE OF p`, [uid]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findByIdForUpdate(id: number): Promise<Product | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE p.id = $1 FOR UPDATE OF p`, [id]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findBySku(sku: string): Promise<Product | null> {
    const { rows } = await this.db.query(`${BASE_SELECT} WHERE p.sku = $1`, [sku]);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  public async findAll(f: InventoryFilters): Promise<Product[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (f.category)  { params.push(f.category);  where.push(`c.name = $${params.length}`); }
    if (f.supplier)  { params.push(f.supplier);  where.push(`s.name = $${params.length}`); }
    if (f.minStock !== undefined) { params.push(f.minStock); where.push(`p.current_stock >= $${params.length}`); }
    if (f.maxStock !== undefined) { params.push(f.maxStock); where.push(`p.current_stock <= $${params.length}`); }
    if (f.activeAlert) {
      where.push(`EXISTS (SELECT 1 FROM alerts a WHERE a.product_id = p.id AND a.alert_status_id = 1)`);
    }

    const sql = `${BASE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.name`;
    const { rows } = await this.db.query(sql, params);
    return rows.map((r) => this.toEntity(r));
  }

  public async save(product: Product): Promise<Product> {
    try {
      if (!product.isPersisted()) {
        // La BD asigna id (IDENTITY), uid y SKU (trigger); los nombres se resuelven aquí
        const { rows } = await this.db.query(
          `INSERT INTO products (name, category_id, price, current_stock, minimum_stock, supplier_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, uid, sku,
             (SELECT name FROM categories WHERE id = $2) AS category,
             (SELECT name FROM suppliers  WHERE id = $6) AS supplier`,
          [product.name, product.categoryId, product.price,
           product.currentStock, product.minimumStock, product.supplierId]
        );
        return Product.restore({
          id: rows[0].id, uid: rows[0].uid, sku: rows[0].sku, name: product.name,
          categoryId: product.categoryId, category: rows[0].category,
          price: product.price, currentStock: product.currentStock,
          minimumStock: product.minimumStock,
          supplierId: product.supplierId, supplier: rows[0].supplier
        });
      }

      await this.db.query(
        `UPDATE products SET
           name = $2, category_id = $3, price = $4,
           current_stock = $5, minimum_stock = $6, supplier_id = $7
         WHERE id = $1`,
        [product.id, product.name, product.categoryId, product.price,
         product.currentStock, product.minimumStock, product.supplierId]
      );
      return product;
    } catch (err) {
      if ((err as { code?: string }).code === FK_VIOLATION) {
        throw new ValidationError('La categoría o el proveedor indicados no existen.');
      }
      throw err;
    }
  }

  private toEntity(row: any): Product {
    return Product.restore({
      id: row.id, uid: row.uid, sku: row.sku, name: row.name,
      categoryId: row.category_id, category: row.category,
      price: row.price, currentStock: row.current_stock, minimumStock: row.minimum_stock,
      supplierId: row.supplier_id, supplier: row.supplier
    });
  }
}
