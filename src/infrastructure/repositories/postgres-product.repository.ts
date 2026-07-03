import { injectable } from 'inversify';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository, InventoryFilters } from '../../domain/ports/product.repository';
import { Queryable } from '../database/queryable';

const BASE_SELECT = `
  SELECT p.id, p.uid, p.sku, p.name, c.name AS category, p.price::float AS price,
         p.current_stock, p.minimum_stock, s.name AS supplier
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN suppliers  s ON s.id = p.supplier_id
`;

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
    // El dominio trabaja con nombres de categoría/proveedor; aquí se normalizan
    await this.db.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [product.category]
    );
    await this.db.query(
      `INSERT INTO suppliers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [product.supplier]
    );

    if (!product.isPersisted()) {
      // INSERT: la BD asigna id (IDENTITY) y uid (gen_random_uuid)
      // El SKU no se envía: lo genera el trigger trg_products_generate_sku
      const { rows } = await this.db.query(
        `INSERT INTO products (name, category_id, price, current_stock, minimum_stock, supplier_id)
         VALUES ($1,
                 (SELECT id FROM categories WHERE name = $2),
                 $3, $4, $5,
                 (SELECT id FROM suppliers WHERE name = $6))
         RETURNING id, uid, sku`,
        [product.name, product.category, product.price,
         product.currentStock, product.minimumStock, product.supplier]
      );
      return Product.restore({
        id: rows[0].id, uid: rows[0].uid, sku: rows[0].sku, name: product.name,
        category: product.category, price: product.price,
        currentStock: product.currentStock, minimumStock: product.minimumStock,
        supplier: product.supplier
      });
    }

    await this.db.query(
      `UPDATE products SET
         name          = $2,
         category_id   = (SELECT id FROM categories WHERE name = $3),
         price         = $4,
         current_stock = $5,
         minimum_stock = $6,
         supplier_id   = (SELECT id FROM suppliers WHERE name = $7)
       WHERE id = $1`,
      [product.id, product.name, product.category, product.price,
       product.currentStock, product.minimumStock, product.supplier]
    );
    return product;
  }

  private toEntity(row: any): Product {
    return Product.restore({
      id: row.id, uid: row.uid, sku: row.sku, name: row.name, category: row.category,
      price: row.price, currentStock: row.current_stock,
      minimumStock: row.minimum_stock, supplier: row.supplier
    });
  }
}
