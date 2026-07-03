import { Product } from '../domain/entities/product.entity';
import { InsufficientStockError, ValidationError } from '../domain/errors/domain.errors';

const validProps = {
  name: 'Agua Mineral 500ml', categoryId: 1,
  price: 1500, currentStock: 150, minimumStock: 50, supplierId: 2
};

describe('Product (entidad de dominio)', () => {
  describe('create — RF-01', () => {
    it('crea un producto válido con stock inicial 0 por defecto', () => {
      const p = Product.create({ ...validProps, currentStock: undefined });
      expect(p.currentStock).toBe(0);
      expect(p.isPersisted()).toBe(false);
    });

    it('el SKU no existe hasta que la BD lo genera al persistir', () => {
      const p = Product.create(validProps);
      expect(() => p.sku).toThrow(ValidationError);
    });

    it.each([
      ['nombre corto', { ...validProps, name: 'ab' }],
      ['precio 0', { ...validProps, price: 0 }],
      ['precio negativo', { ...validProps, price: -5 }],
      ['stock mínimo 0', { ...validProps, minimumStock: 0 }],
      ['categoryId inválido', { ...validProps, categoryId: 0 }],
      ['supplierId inválido', { ...validProps, supplierId: -1 }]
    ])('rechaza %s', (_label, props) => {
      expect(() => Product.create(props as any)).toThrow(ValidationError);
    });
  });

  describe('decreaseStock — Regla 1', () => {
    it('descuenta stock en una salida válida', () => {
      const p = Product.create(validProps);
      p.decreaseStock(50);
      expect(p.currentStock).toBe(100);
    });

    it('rechaza dejar stock negativo indicando el faltante', () => {
      const p = Product.create({ ...validProps, currentStock: 10 });
      try {
        p.decreaseStock(25);
        fail('debió lanzar InsufficientStockError');
      } catch (e) {
        expect(e).toBeInstanceOf(InsufficientStockError);
        expect((e as InsufficientStockError).message).toContain('Faltan 15');
        expect(p.currentStock).toBe(10); // el estado no cambió
      }
    });
  });

  describe('isAtOrBelowMinimum — RF-03', () => {
    it('true cuando stock == mínimo', () => {
      const p = Product.create({ ...validProps, currentStock: 50, minimumStock: 50 });
      expect(p.isAtOrBelowMinimum()).toBe(true);
    });
    it('false cuando stock > mínimo', () => {
      const p = Product.create(validProps);
      expect(p.isAtOrBelowMinimum()).toBe(false);
    });
  });

  it('minimumOrderQuantity — Regla 2: es 2x el stock mínimo', () => {
    const p = Product.create(validProps);
    expect(p.minimumOrderQuantity()).toBe(100);
  });
});
