import { OrderStatus, PurchaseOrder } from '../domain/entities/purchase-order.entity';
import { ConflictError, ValidationError } from '../domain/errors/domain.errors';

const build = () => PurchaseOrder.create({
  productId: 1, supplierId: 2, quantity: 80, minimumOrderQuantity: 80
});

describe('PurchaseOrder (máquina de estados — RF-04, RF-05)', () => {
  it('inicia en PENDIENTE y sin persistir', () => {
    const o = build();
    expect(o.status).toBe(OrderStatus.PENDIENTE);
    expect(o.isPersisted()).toBe(false);
  });

  it('Regla 2: rechaza cantidad menor a 2x el stock mínimo', () => {
    expect(() => PurchaseOrder.create({
      productId: 1, supplierId: 2, quantity: 79, minimumOrderQuantity: 80
    })).toThrow(ValidationError);
  });

  it('PENDIENTE → APROBADA', () => {
    const o = build();
    o.approve();
    expect(o.status).toBe(OrderStatus.APROBADA);
    expect(o.approvedAt).not.toBeNull();
  });

  it('PENDIENTE → RECHAZADA exige motivo de al menos 10 caracteres', () => {
    const o = build();
    expect(() => o.reject('corto')).toThrow(ValidationError);
    o.reject('Proveedor sin disponibilidad');
    expect(o.status).toBe(OrderStatus.RECHAZADA);
  });

  it('APROBADA → RECIBIDA', () => {
    const o = build();
    o.approve();
    o.receive();
    expect(o.status).toBe(OrderStatus.RECIBIDA);
  });

  it('Regla 5: no se puede recibir una orden PENDIENTE', () => {
    expect(() => build().receive()).toThrow(ConflictError);
  });

  it('Regla 5: no se puede aprobar dos veces', () => {
    const o = build();
    o.approve();
    expect(() => o.approve()).toThrow(ConflictError);
  });
});
