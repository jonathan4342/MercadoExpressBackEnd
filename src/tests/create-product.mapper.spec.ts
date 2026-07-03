import { Request } from 'express';
import { Product } from '../domain/entities/product.entity';
import { ValidationError } from '../domain/errors/domain.errors';
import { CreateProductMapper } from '../presentation/mappers/create-product.mapper';

const reqWith = (body: unknown): Request => ({ body } as Request);
const validBody = {
  name: 'Manzana Roja kg', categoryId: 5,
  price: 4200, currentStock: 100, minimumStock: 20, supplierId: 1
};

describe('CreateProductMapper (validación en el middleware)', () => {
  const mapper = new CreateProductMapper();

  it('construye la ENTIDAD de dominio desde el request (el DTO muere en presentation)', () => {
    const product = mapper.map(reqWith(validBody));
    expect(product).toBeInstanceOf(Product);
    expect(product.price).toBe(4200);
    expect(product.categoryId).toBe(5);
    expect(product.supplierId).toBe(1);
    expect(product.isPersisted()).toBe(false); // id, uid y SKU los asigna la BD
  });

  it.each([
    ['sin nombre', { ...validBody, name: undefined }],
    ['nombre vacío', { ...validBody, name: '   ' }],
    ['precio como texto', { ...validBody, price: '4200' }],
    ['sin stock mínimo', { ...validBody, minimumStock: undefined }],
    ['categoryId como texto', { ...validBody, categoryId: '5' }],
    ['sin supplierId', { ...validBody, supplierId: undefined }],
    ['nombre muy corto (regla de la entidad)', { ...validBody, name: 'ab' }],
    ['precio 0 (regla de la entidad)', { ...validBody, price: 0 }],
    ['body vacío', undefined]
  ])('rechaza request con %s antes de llegar al caso de uso', (_label, body) => {
    expect(() => mapper.map(reqWith(body))).toThrow(ValidationError);
  });

  it('currentStock es opcional: la entidad lo inicia en 0', () => {
    const product = mapper.map(reqWith({ ...validBody, currentStock: undefined }));
    expect(product.currentStock).toBe(0);
  });
});
