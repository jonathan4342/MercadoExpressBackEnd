/**
 * OBSOLETO (v2): la creación y resolución de alertas se movió a la base de datos
 * (trigger trg_products_stock_alerts en database/schema.sql). La aplicación ahora
 * solo LEE alertas a través de IAlertRepository. Se conserva el archivo vacío
 * porque el entorno no permite eliminarlo; puedes borrarlo en tu repositorio.
 */
export {};
