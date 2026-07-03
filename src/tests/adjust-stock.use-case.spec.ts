/** NOTA: renombrar a adjust-stock.service.spec.ts (el entorno no permite renombrar archivos). */
import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { AdjustStockService } from '../application/services/adjust-stock.service';
import { Alert, AlertStatus, AlertType } from '../domain/entities/alert.entity';
import { InventoryMovement, MovementType } from '../domain/entities/inventory-movement.entity';
import { Product } from '../domain/entities/product.entity';
import { InsufficientStockError } from '../domain/errors/domain.errors';
import { IUnitOfWork, RepositoryContext, UnitOfWorkOptions } from '../domain/ports/unit-of-work';
import { StockAdjustment } from '../domain/value-objects/stock-adjustment.vo';

/** FakeDb emula el trigger de alertas de la BD en products.save. */
class FakeDb {
  products = new Map<number, Product>();
  movements: InventoryMovement[] = [];
  alerts: Alert[] = [];
  private seq = 1;

  seedProduct(props: {
    sku: string; name: string; categoryId: number; category: string; price: number;
    currentStock: number; minimumStock: number; supplierId: number; supplier: string;
  }): Product {
    const persisted = Product.restore({ id: this.seq, uid: randomUUID(), ...props });
    this.products.set(this.seq++, persisted);
    this.emulateAlertTrigger(persisted);
    return persisted;
  }

  emulateAlertTrigger(p: Product): void {
    const active = this.alerts.find((a) => a.productId === p.id && a.isActive());
    if (p.isAtOrBelowMinimum() && !active) {
      this.alerts.push(Alert.restore({
        id: this.alerts.length + 1, uid: randomUUID(), productId: p.id, productUid: p.uid,
        type: AlertType.STOCK_BAJO, status: AlertStatus.ACTIVA,
        createdAt: new Date(), resolvedAt: null
      }));
    } else if (!p.isAtOrBelowMinimum() && active) {
      this.alerts = this.alerts.map((a) =>
        a.id === active.id
          ? Alert.restore({ ...a, status: AlertStatus.RESUELTA, resolvedAt: new Date() })
          : a
      );
    }
  }

  context(): RepositoryContext {
    return {
      products: {
        findByUid: async (uid) => [...this.products.values()].find((p) => p.uid === uid) ?? null,
        findByUidForUpdate: async (uid) =>
          [...this.products.values()].find((p) => p.uid === uid) ?? null,
        findByIdForUpdate: async (id) => this.products.get(id) ?? null,
        findBySku: async () => null,
        findAll: async () => [...this.products.values()],
        save: async (p) => { this.products.set(p.id, p); this.emulateAlertTrigger(p); return p; }
      },
      movements: {
        append: async (m) => { this.movements.push(m); return m; },
        findByProductId: async (id) => this.movements.filter((m) => m.productId === id)
      },
      alerts: {
        findByUid: async (uid) => this.alerts.find((a) => a.uid === uid) ?? null,
        findActiveByProductId: async (pid) =>
          this.alerts.find((a) => a.productId === pid && a.isActive()) ?? null,
        findAll: async () => this.alerts
      },
      orders: {
        findByUid: async () => null,
        findByUidForUpdate: async () => null,
        findAll: async () => [],
        save: async (o) => o
      }
    };
  }
}

class FakeUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: FakeDb) {}
  execute<T>(work: (r: RepositoryContext) => Promise<T>, _o?: UnitOfWorkOptions): Promise<T> {
    return work(this.db.context());
  }
}

describe('AdjustStockService (RF-02 + RF-03 — orquesta 3 casos de uso)', () => {
  let db: FakeDb;
  let service: AdjustStockService;
  let product: Product;

  beforeEach(() => {
    db = new FakeDb();
    service = new AdjustStockService(new FakeUnitOfWork(db));
    product = db.seedProduct({
      sku: 'LAC002', name: 'Yogur Natural 500g', categoryId: 2, category: 'Lácteos',
      price: 2800, currentStock: 30, minimumStock: 25, supplierId: 2, supplier: 'Lácteos del Valle'
    });
  });

  it('registra el movimiento con el stock resultante', async () => {
    const r = await service.execute(product.uid, StockAdjustment.create({
      type: MovementType.SALIDA, quantity: 4, reason: 'Venta mostrador'
    }), 'jonathan');
    expect(r.product.currentStock).toBe(26);
    expect(db.movements).toHaveLength(1);
    expect(db.movements[0].stockAfter).toBe(26);
  });

  it('Regla 1: rechaza dejar stock negativo y no registra movimiento', async () => {
    await expect(service.execute(product.uid, StockAdjustment.create({
      type: MovementType.SALIDA, quantity: 99, reason: 'Venta'
    }), 'jonathan')).rejects.toThrow(InsufficientStockError);
    expect(db.movements).toHaveLength(0);
  });

  it('devuelve la alerta ACTIVA creada por el trigger al quedar bajo el mínimo', async () => {
    const r = await service.execute(product.uid, StockAdjustment.create({
      type: MovementType.SALIDA, quantity: 5, reason: 'Venta'
    }), 'jonathan');
    expect(r.alert).not.toBeNull();
    expect(r.alert!.status).toBe(AlertStatus.ACTIVA);
  });

  it('Regla 4: un segundo ajuste bajo el mínimo no duplica la alerta', async () => {
    const salida5 = () => StockAdjustment.create({ type: MovementType.SALIDA, quantity: 5, reason: 'Venta' });
    await service.execute(product.uid, salida5(), 'j');
    await service.execute(product.uid, salida5(), 'j');
    expect(db.alerts).toHaveLength(1);
  });

  it('Regla 3: la alerta queda RESUELTA cuando el stock supera el mínimo', async () => {
    await service.execute(product.uid, StockAdjustment.create({ type: MovementType.SALIDA, quantity: 10, reason: 'Venta' }), 'j');
    const r = await service.execute(product.uid, StockAdjustment.create({ type: MovementType.ENTRADA, quantity: 50, reason: 'Reposición' }), 'j');
    expect(r.alert).toBeNull();
    expect(db.alerts[0].status).toBe(AlertStatus.RESUELTA);
  });
});
