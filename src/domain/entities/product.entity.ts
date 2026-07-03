import { MovementType } from './inventory-movement.entity';
import { Sku } from '../value-objects/sku.vo';
import { StockAdjustment } from '../value-objects/stock-adjustment.vo';
import { InsufficientStockError, ValidationError } from '../errors/domain.errors';

export interface CreateProductProps {
  name: string;
  categoryId: number;
  price: number;
  currentStock?: number;
  minimumStock: number;
  supplierId: number;
}

export interface UpdateProductProps {
  name: string;
  categoryId: number;
  price: number;
  minimumStock: number;
  supplierId: number;
}

/**
 * Entidad de dominio (RF-01, RF-02, Reglas 1 y 2).
 * Referencia categoría y proveedor por ID (los selects del front envían IDs);
 * los nombres se resuelven al leer desde la BD (JOIN) para las respuestas.
 * id, uid y SKU los asigna la BD al persistir.
 */
export class Product {
  private constructor(
    private readonly _id: number | null,
    private readonly _uid: string | null,
    private readonly _sku: Sku | null,
    private _name: string,
    private _categoryId: number,
    private readonly _categoryName: string | null,
    private _price: number,
    private _currentStock: number,
    private _minimumStock: number,
    private _supplierId: number,
    private readonly _supplierName: string | null
  ) {}

  // ---------- Fábricas ----------
  public static create(props: CreateProductProps): Product {
    Product.assertName(props.name);
    Product.assertPrice(props.price);
    Product.assertMinimumStock(props.minimumStock);
    Product.assertCatalogId(props.categoryId, 'categoryId');
    Product.assertCatalogId(props.supplierId, 'supplierId');
    const initialStock = props.currentStock ?? 0;
    if (!Number.isInteger(initialStock) || initialStock < 0) {
      throw new ValidationError('El stock inicial debe ser un entero mayor o igual a 0.');
    }

    return new Product(
      null, null, null,
      props.name.trim(), props.categoryId, null, props.price,
      initialStock, props.minimumStock, props.supplierId, null
    );
  }

  /**
   * RF-01 (edición): actualiza los datos editables de un producto ya persistido.
   * El stock actual NO se toca aquí (se gestiona vía ajustes RF-02). Los nombres
   * de categoría/proveedor se resuelven al releer de la BD tras guardar.
   */
  public updateDetails(props: UpdateProductProps): void {
    Product.assertName(props.name);
    Product.assertPrice(props.price);
    Product.assertMinimumStock(props.minimumStock);
    Product.assertCatalogId(props.categoryId, 'categoryId');
    Product.assertCatalogId(props.supplierId, 'supplierId');
    this._name = props.name.trim();
    this._categoryId = props.categoryId;
    this._price = props.price;
    this._minimumStock = props.minimumStock;
    this._supplierId = props.supplierId;
  }

  /** Rehidratación desde la base de datos (con nombres resueltos por JOIN). */
  public static restore(row: {
    id: number; uid: string; sku: string; name: string;
    categoryId: number; category: string; price: number;
    currentStock: number; minimumStock: number;
    supplierId: number; supplier: string;
  }): Product {
    return new Product(
      row.id, row.uid, Sku.create(row.sku), row.name,
      row.categoryId, row.category, row.price,
      row.currentStock, row.minimumStock, row.supplierId, row.supplier
    );
  }

  // ---------- Identidad ----------
  public isPersisted(): boolean { return this._id !== null; }

  get id(): number {
    if (this._id === null) throw new ValidationError('El producto aún no ha sido persistido.');
    return this._id;
  }

  get uid(): string {
    if (this._uid === null) throw new ValidationError('El producto aún no ha sido persistido.');
    return this._uid;
  }

  get sku(): Sku {
    if (this._sku === null) {
      throw new ValidationError('El SKU lo asigna la base de datos al persistir el producto.');
    }
    return this._sku;
  }

  // ---------- Comportamiento de negocio ----------
  /** RF-02: aplica un ajuste de inventario (la Regla 1 se valida en decreaseStock). */
  public adjust(adjustment: StockAdjustment): void {
    if (adjustment.type === MovementType.ENTRADA) {
      this.increaseStock(adjustment.quantity);
    } else {
      this.decreaseStock(adjustment.quantity);
    }
  }

  public increaseStock(quantity: number): void {
    Product.assertQuantity(quantity);
    this._currentStock += quantity;
  }

  /** Regla 1: nunca stock negativo. */
  public decreaseStock(quantity: number): void {
    Product.assertQuantity(quantity);
    if (quantity > this._currentStock) {
      throw new InsufficientStockError(this._currentStock, quantity);
    }
    this._currentStock -= quantity;
  }

  public isAtOrBelowMinimum(): boolean {
    return this._currentStock <= this._minimumStock;
  }

  /** Regla 2: cantidad mínima de una orden = 2x stock mínimo. */
  public minimumOrderQuantity(): number {
    return this._minimumStock * 2;
  }

  // ---------- Getters ----------
  get name(): string { return this._name; }
  get categoryId(): number { return this._categoryId; }
  get supplierId(): number { return this._supplierId; }
  get price(): number { return this._price; }
  get currentStock(): number { return this._currentStock; }
  get minimumStock(): number { return this._minimumStock; }

  /** Nombre de la categoría (disponible tras leer de la BD). */
  get category(): string {
    if (this._categoryName === null) {
      throw new ValidationError('El nombre de la categoría se resuelve al persistir.');
    }
    return this._categoryName;
  }

  /** Nombre del proveedor (disponible tras leer de la BD). */
  get supplier(): string {
    if (this._supplierName === null) {
      throw new ValidationError('El nombre del proveedor se resuelve al persistir.');
    }
    return this._supplierName;
  }

  // ---------- Validaciones privadas ----------
  private static assertName(name: string): void {
    const n = (name ?? '').trim();
    if (n.length < 3 || n.length > 100) {
      throw new ValidationError('El nombre es obligatorio y debe tener entre 3 y 100 caracteres.');
    }
  }
  private static assertPrice(price: number): void {
    if (typeof price !== 'number' || !(price > 0)) {
      throw new ValidationError('El precio es obligatorio y debe ser mayor a 0.');
    }
  }
  private static assertMinimumStock(min: number): void {
    if (!Number.isInteger(min) || min <= 0) {
      throw new ValidationError('El stock mínimo es obligatorio y debe ser un entero mayor a 0.');
    }
  }
  private static assertCatalogId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValidationError(`El campo '${field}' es obligatorio y debe ser un ID válido.`);
    }
  }
  private static assertQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('La cantidad debe ser un entero mayor a 0.');
    }
  }
}
