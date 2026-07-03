import { Alert } from '../../domain/entities/alert.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { Product } from '../../domain/entities/product.entity';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import {
  AlertResponseDto, MovementResponseDto, OrderResponseDto, ProductResponseDto
} from '../dtos/dtos';

/** Mappers de salida: la API nunca expone entidades de dominio directamente. */
export class ProductResponseMapper {
  public static toDto(p: Product): ProductResponseDto {
    return {
      uid: p.uid, sku: p.sku.value, name: p.name,
      categoryId: p.categoryId, category: p.category,
      price: p.price, currentStock: p.currentStock, minimumStock: p.minimumStock,
      supplierId: p.supplierId, supplier: p.supplier,
      belowMinimum: p.isAtOrBelowMinimum()
    };
  }
}

export class MovementResponseMapper {
  public static toDto(m: InventoryMovement): MovementResponseDto {
    return {
      uid: m.uid, type: m.type, quantity: m.quantity,
      reason: m.reason, stockAfter: m.stockAfter, createdAt: m.createdAt
    };
  }
}

export class AlertResponseMapper {
  public static toDto(a: Alert): AlertResponseDto {
    return {
      uid: a.uid, productId: a.productId, productUid: a.productUid, type: a.type, status: a.status,
      createdAt: a.createdAt, resolvedAt: a.resolvedAt
    };
  }
}

export class OrderResponseMapper {
  public static toDto(o: PurchaseOrder): OrderResponseDto {
    return {
      uid: o.uid, productId: o.productId, productUid: o.productUid,
      supplierId: o.supplierId, supplier: o.supplier, alertId: o.alertId,
      quantity: o.quantity, status: o.status, rejectionReason: o.rejectionReason,
      createdAt: o.createdAt, approvedAt: o.approvedAt, receivedAt: o.receivedAt
    };
  }
}
