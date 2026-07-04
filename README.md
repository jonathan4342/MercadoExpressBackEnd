# MercadoExpress — Sistema de Gestión de Inventario

Aplicación full‑stack para la gestión de inventario: administración de productos, ajustes de stock (entradas/salidas) con historial de movimientos, alertas automáticas de stock bajo y órdenes de compra. El backend expone una API REST y el frontend es una SPA en Angular.

---

## Tabla de contenido

- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Requisitos previos](#requisitos-previos)
- [Ejecución local](#ejecución-local)
  - [1. Base de datos](#1-base-de-datos)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [Credenciales de acceso](#credenciales-de-acceso)
- [Documentación de la API](#documentación-de-la-api)
- [Arquitectura elegida y justificación](#arquitectura-elegida-y-justificación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pruebas](#pruebas)

---

## Tecnologías utilizadas

### Backend

- **Node.js + TypeScript** — entorno de ejecución y tipado estático de todo el código.
- **Express** — framework HTTP sobre el que se montan las rutas y middlewares.
- **InversifyJS** (`inversify` + `reflect-metadata`) — contenedor de inyección de dependencias.
- **PostgreSQL** con el driver **`pg`** — persistencia relacional, con `pgcrypto`, triggers y funciones almacenadas.
- **jsonwebtoken (JWT)** — autenticación por token Bearer.
- **Helmet** y **CORS** — cabeceras de seguridad y control de orígenes.
- **dotenv** — carga de variables de entorno.
- **Jest + Supertest + ts‑jest** — pruebas unitarias y de integración.
- **ts‑node‑dev** — recarga en caliente durante el desarrollo.

### Frontend

- **Angular 18** — SPA con componentes *standalone* y *signals*.
- **Angular Material + CDK** — biblioteca de componentes de UI.
- **RxJS** — manejo reactivo de las llamadas HTTP.
- **TypeScript**.

### Base de datos

- **PostgreSQL** (extensión `pgcrypto` para el hash de contraseñas y los UID). El esquema incluye triggers que actualizan `updated_at` y que generan/resuelven las alertas de stock bajo automáticamente.

---

## Requisitos previos

- **Node.js ≥ 18.19** (o 20+) y **npm**.
- **PostgreSQL ≥ 13** con acceso por línea de comandos (`psql`).
- **Angular CLI** (opcional; puedes usar `npx ng`).

---

## Ejecución local

El repositorio contiene tres piezas: `database/` (scripts SQL), `backend/` (API REST) y `frontend/` (SPA Angular). Levántalas en ese orden.

### 1. Base de datos

Crea la base de datos y carga el esquema y los datos iniciales:

```bash
# Crear la base de datos (ajusta usuario/host según tu instalación)
createdb mercadoexpress

# Cargar esquema y datos de ejemplo
psql "postgresql://postgres:postgres@localhost:5432/mercadoexpress" -f database/schema.sql
psql "postgresql://postgres:postgres@localhost:5432/mercadoexpress" -f database/seed.sql
```

> Alternativamente, desde la carpeta `backend/` puedes usar los scripts `npm run db:schema` y `npm run db:seed` (leen la variable `DATABASE_URL`).

### 2. Backend

```bash
cd backend
npm install

# Configura las variables de entorno
cp .env.example .env
```

Edita `.env` según tu entorno:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mercadoexpress
CORS_ORIGIN=http://localhost:4200
JWT_SECRET=cambia-este-secreto-en-produccion
JWT_EXPIRES_IN=3600
```

Arranca el servidor en modo desarrollo:

```bash
npm run dev
```

La API queda disponible en **http://localhost:3000/api** (health check en `GET /api/health`).

Para producción: `npm run build` y luego `npm start`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación queda disponible en **http://localhost:4200** y apunta por defecto a `http://localhost:3000/api` (configurable en `src/environments/environment.ts`).

---

## Credenciales de acceso

El `seed.sql` crea un usuario administrador inicial:

- **Usuario:** `admin`
- **Contraseña:** `Admin123*`

> Cambia esta contraseña en cualquier entorno que no sea local.

---

## Documentación de la API

En la carpeta `backend/` encontrarás:

- **`openapi.yaml`** — especificación OpenAPI 3.0. Puedes visualizarla en [editor.swagger.io](https://editor.swagger.io) o con Swagger UI.
- **`MercadoExpress.postman_collection.json`** — colección de Postman. Importa, ejecuta primero *Auth → Obtener token* (guarda el JWT automáticamente) y el resto de peticiones reutilizan la variable `{{token}}`.

Endpoints principales:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/token` | Emitir token JWT (público) |
| `GET` | `/api/products` | Listar inventario (con filtros) |
| `POST` | `/api/products` | Crear producto |
| `PUT` | `/api/products/:uid` | Actualizar datos del producto |
| `POST` | `/api/products/:uid/adjustments` | Ajustar stock (entrada/salida) |
| `GET` | `/api/products/:uid/movements` | Historial de movimientos |
| `GET` | `/api/categories` · `/api/suppliers` | Catálogos |
| `GET` | `/api/alerts` | Alertas de stock bajo |
| `GET` `POST` | `/api/orders` | Órdenes de compra |
| `PATCH` | `/api/orders/:uid/approve\|reject\|receive` | Ciclo de vida de una orden |

---

## Arquitectura elegida y justificación

El backend está construido siguiendo una **arquitectura hexagonal** (puertos y adaptadores). Se eligió este enfoque porque permite que la aplicación crezca manteniendo el foco en el **negocio**: las reglas de dominio quedan en el centro, aisladas de los detalles técnicos (base de datos, framework HTTP, mecanismo de autenticación), de modo que estos últimos pueden cambiar sin afectar la lógica de inventario.

La arquitectura organiza el código en cuatro capas con una dependencia que siempre apunta hacia adentro:

- **Dominio** — el corazón de la aplicación. Contiene las **entidades** (`Product`, `PurchaseOrder`, `InventoryMovement`, `Alert`) y los **value objects** (`StockAdjustment`, `Sku`), donde vive cada regla de negocio. Por ejemplo, la entidad `Product` es la responsable de no permitir stock negativo en una salida, y el value object `StockAdjustment` valida que la cantidad sea un entero positivo y que el motivo sea obligatorio. Esta capa no conoce Express, ni PostgreSQL, ni JWT: solo expresa el negocio. Aquí también se declaran los **puertos** (interfaces como `IProductRepository` o `IUnitOfWork`) que el dominio necesita del exterior.
- **Aplicación** — orquesta los casos de uso (`AdjustStockService`, `CreateProductUseCase`, etc.). Coordina entidades y repositorios para completar una operación de negocio —por ejemplo, un ajuste de stock que actualiza el producto, registra el movimiento y consulta la alerta resultante dentro de una misma transacción—, pero delega toda decisión de negocio en el dominio.
- **Infraestructura** — los **adaptadores** que implementan los puertos con tecnología concreta: repositorios sobre PostgreSQL (`PostgresProductRepository`, …), la unidad de trabajo transaccional y el servicio de tokens JWT. Si mañana se cambiara el motor de base de datos, solo se reescribe esta capa.
- **Presentación** — el adaptador de entrada HTTP: controladores, rutas, *mappers* de request/response y middlewares (autenticación, validación, manejo de errores). Traduce el mundo HTTP hacia el dominio y viceversa; los DTO nunca cruzan hacia adentro, solo entran entidades y value objects.

Esta separación de responsabilidades se complementa con varios patrones de diseño que refuerzan el desacoplamiento:

- **Repository** — abstrae el acceso a datos detrás de una interfaz de dominio. La lógica de negocio trabaja contra `IProductRepository`, no contra consultas SQL, lo que mantiene la persistencia intercambiable y facilita las pruebas.
- **Inversión de dependencias (DIP)** — las capas internas definen las interfaces (puertos) y las externas las implementan. El dominio depende de abstracciones, nunca de detalles concretos.
- **Inyección de dependencias** — mediante **InversifyJS**, un contenedor central resuelve y ensambla las dependencias en tiempo de ejecución. Esto elimina el acoplamiento por instanciación manual, permite sustituir implementaciones (por ejemplo, un repositorio en memoria para tests) y centraliza la configuración del grafo de objetos.
- **Unit of Work** — agrupa las operaciones de un caso de uso en una única transacción, garantizando la consistencia (o un *rollback* completo) cuando un ajuste toca varias tablas.

En conjunto, la arquitectura hexagonal más estos patrones nos dan un sistema **testeable, mantenible y preparado para crecer**: las reglas de negocio están protegidas y centralizadas, cada componente tiene una única responsabilidad, y los detalles de infraestructura son reemplazables sin reescribir el núcleo del negocio.

El frontend, por su parte, sigue una organización por funcionalidades (*feature‑based*): una capa `core` con servicios, modelos, guards e interceptores transversales, y una capa `features` con las pantallas (inventario, alertas, órdenes, autenticación) construidas con componentes *standalone* de Angular.

---

## Estructura del proyecto

```
prueba-inventario/
├── backend/
│   ├── src/
│   │   ├── domain/            # Entidades, value objects, puertos, errores
│   │   ├── application/       # Casos de uso y servicios de aplicación
│   │   ├── infrastructure/    # Repositorios PostgreSQL, seguridad, BD
│   │   ├── presentation/      # Controladores, rutas, mappers, middlewares
│   │   ├── container/         # Configuración de inyección de dependencias
│   │   └── main.ts            # Punto de entrada
│   ├── openapi.yaml
│   └── MercadoExpress.postman_collection.json
├── frontend/
│   └── src/app/
│       ├── core/             # Servicios, modelos, guards, interceptores
│       └── features/         # Inventario, alertas, órdenes, auth
└── database/
    ├── schema.sql            # Esquema, triggers y funciones
    └── seed.sql              # Datos iniciales (incluye usuario admin)
```

---

## Pruebas

Backend (Jest + Supertest):

```bash
cd backend
npm test              # ejecuta la suite
npm run test:coverage # con reporte de cobertura
```

Frontend (Karma/Jasmine):

```bash
cd frontend
npm test
```