// Solo DTOs de RESPUESTA: los DTOs de entrada desaparecieron — los mappers
// construyen entidades/value objects de dominio y eso es lo que cruza el
// controlador hacia las capas internas.

export interface ProductResponseDto {
  uid: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  currentStock: number;
  minimumStock: number;
  supplier: string;
  belowMinimum: boolean;
}

export interface MovementResponseDto {
  uid: string | null;
  type: string;
  quantity: number;
  reason: string;
  stockAfter: number;
  createdAt: Date | null;
}

export interface AlertResponseDto {
  uid: string;
  productId: number;
  type: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface OrderResponseDto {
  uid: string;
  productId: number;
  supplier: string;
  alertId: number | null;
  quantity: number;
  status: string;
  rejectionReason: string | null;
  createdAt: Date | null;
  approvedAt: Date | null;
  receivedAt: Date | null;
}
