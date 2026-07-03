# MercadoExpress — API de Gestión de Inventario

API REST en **Node.js + TypeScript** con **arquitectura hexagonal**, **InversifyJS** (inyección de dependencias), **PostgreSQL** (SQL puro con `pg`) y **Jest**.

## Ejecutar localmente

```bash
# 1. Base de datos (crea schema y seed automáticamente)
docker compose up -d

# 2. Variables de entorno
cp .env.example .env

# 3. Dependencias y arranque
npm install
npm run dev     # http://localhost:3000/api

# 4. Tests
npm test
npm run test:coverage
```

## Arquitectura

```
src/
├── domain/           # Núcleo: sin dependencias externas
│   ├── entities/     # Product, Alert, PurchaseOrder, InventoryMovement (con comportamiento)
│   ├── value-objects/# Sku
│   ├── errors/       # Jerarquía de errores de dominio
│   └── ports/        # Contratos: IProductRepository, IUnitOfWork, ...
├── application/      # Casos de uso (1 clase = 1 responsabilidad) + AlertManager
├── infrastructure/   # Adaptadores: PostgreSQL (pg), Express, UnitOfWork
└── container/        # Composition root de Inversify
```

**Decisiones clave**

- Las reglas de negocio viven en las **entidades** (stock negativo, transiciones de orden, motivo de rechazo) y en el **AlertManager** (creación/cierre de alertas): son testeables sin base de datos.
- **UnitOfWork** garantiza atomicidad en flujos que tocan varios agregados (ajuste de stock y recepción de orden) con `SELECT ... FOR UPDATE` para concurrencia.
- La base de datos **refuerza** las invariantes (CHECKs, índice único parcial de alertas, trigger de inmutabilidad de movimientos): defensa en profundidad.
- SOLID: interfaces segregadas por agregado, dependencias invertidas vía puertos + Inversify.

## Endpoints

Ver `PLAN-DE-ACCION.md` en la raíz del proyecto para la tabla completa de endpoints y el mapeo de errores HTTP.
