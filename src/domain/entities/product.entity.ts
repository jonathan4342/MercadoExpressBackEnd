import { MovementType } from './inventory-movement.entity';
import { Sku } from '../value-objects/sku.vo';
import { StockAdjustment } from '../value-objects/stock-adjustment.vo';
import { InsufficientStockError, ValidationError } from '../errors/domain.errors';

export interface CreateProductProps {
  name: string;
  category: string;
  price: number;
  currentStock?: number;
  minimumStock: number;
  supplier: string;
}

/**
 * Entidad de dominio (RF-01, RF-02, Reglas 1 y 2).
 * id  : PK incremental interna (la asigna la BD — GENERATED ALWAYS AS IDENTITY)
 * uid : identificador público UUID (el que expone la API)
 * Ambos son null hasta que el repositorio persiste la entidad.
 */
export class Product {
  private constructor(
    private readonly _id: number | null,
    private readonly _uid: string | null,
    private readonly _sku: Sku | null,
    private _name: string,
    private _category: string,
    private _price: number,
    private _currentStock: number,
    private _minimumStock: number,
    private _supplier: string
  ) {}

  // ---------- Fábricas ----------
  public static create(props: CreateProductProps): Product {
    Product.assertName(props.name);
    Product.assertPrice(props.price);
    Product.assertMinimumStock(props.minimumStock);
    const initialStock = props.currentStock ?? 0;
    if (!Number.isInteger(initialStock) || initialStock < 0) {
      throw new ValidationError('El stock inicial debe ser un entero mayor o igual a 0.');
    }
    if (!props.category?.trim()) throw new ValidationError('La categoría es obligatoria.');
    if (!props.supplier?.trim()) throw new ValidationError('El proveedor es obligatorio.');

    return new Product(
      null, null,
      null, // el SKU lo genera la base de datos al insertar (trigger)
      props.name.trim(), props.category.trim(), props.price,
      initialStock, props.minimumStock, props.supplier.trim()
    );
  }

  /** Rehidratación desde la base de datos. */
  public static restore(row: {
    id: number; uid: string; sku: string; name: string; category: string;
    price: number; currentStock: number; minimumStock: number; supplier: string;
  }): Product {
    return new Product(
      row.id, row.uid, Sku.create(row.sku), row.name, row.category,
      row.price, row.currentStock, row.minimumStock, row.supplier
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
  get category(): string { return this._category; }
  get price(): number { return this._price; }
  get currentStock(): number { return this._currentStock; }
  get minimumStock(): number { return this._minimumStock; }
  get supplier(): string { return this._supplier; }

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
  private static assertQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('La cantidad debe ser un entero mayor a 0.');
    }
  }
}
