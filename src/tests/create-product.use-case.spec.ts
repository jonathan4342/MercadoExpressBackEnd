import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { Product } from '../domain/entities/product.entity';
import { IUnitOfWork, RepositoryContext, UnitOfWorkOptions } from '../domain/ports/unit-of-work';

class FakeUnitOfWork implements IUnitOfWork {
  public products = new Map<number, Product>();
  public lastActor: string | undefined;
  private seq = 1;

  execute<T>(work: (r: RepositoryContext) => Promise<T>, o?: UnitOfWorkOptions): Promise<T> {
    this.lastActor = o?.actor;
    const repos = {
      products: {
        findByUid: async () => null,
        findByUidForUpdate: async () => null,
        findByIdForUpdate: async () => null,
        findBySku: async () => null,
        findByName: async () => null,
        findAll: async () => [...this.products.values()],
        save: async (p: Product) => {
          // Emula el trigger trg_products_generate_sku de la BD
          const persisted = Product.restore({
            id: this.seq, uid: randomUUID(), sku: `FRU00${this.seq}`, name: p.name,
            categoryId: p.categoryId, category: 'Frutas', price: p.price,
            currentStock: p.currentStock, minimumStock: p.minimumStock,
            supplierId: p.supplierId, supplier: 'Distribuidora Andina'
          });
          this.products.set(this.seq++, persisted);
          return persisted;
        }
      },
      movements: { append: async (m: any) => m, findByProductId: async () => [] },
      alerts: { findByUid: async () => null, findActiveByProductId: async () => null, findAll: async () => [] },
      orders: { findByUid: async () => null, findByUidForUpdate: async () => null, findAll: async () => [], save: async (o: any) => o }
    } as RepositoryContext;
    return work(repos);
  }
}

const buildEntity = () => Product.create({
  name: 'Manzana Roja kg', categoryId: 5,
  price: 4200, currentStock: 100, minimumStock: 20, supplierId: 1
});

describe('CreateProductUseCase (RF-01 — POST /api/products)', () => {
  let uow: FakeUnitOfWork;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    uow = new FakeUnitOfWork();
    useCase = new CreateProductUseCase(uow);
  });

  it('persiste la entidad y la devuelve con id, uid y SKU generados por la BD', async () => {
    const p = await useCase.execute(buildEntity(), 'jonathan');
    expect(p.isPersisted()).toBe(true);
    expect(p.id).toBe(1);
    expect(p.uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(p.sku.value).toBe('FRU001'); // generado por la BD (emulada), no enviado por el cliente
  });

  it('propaga el actor a la transacción (changed_by de la auditoría)', async () => {
    await useCase.execute(buildEntity(), 'jonathan');
    expect(uow.lastActor).toBe('jonathan');
  });

  it('la entidad llega con las reglas de dominio ya aplicadas (stock 0 por defecto)', async () => {
    const entity = Product.create({
      name: 'Pera kg', categoryId: 5, price: 3000,
      minimumStock: 10, supplierId: 1
    });
    const p = await useCase.execute(entity, 'j');
    expect(p.currentStock).toBe(0);
  });
});
