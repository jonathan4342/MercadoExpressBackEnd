-- ============================================================
-- Datos de referencia — MercadoExpress (v2)
-- Los diccionarios se insertan en schema.sql (IDs fijos).
-- Las alertas NO se insertan: las crea el trigger trg_products_stock_alerts
-- al insertar los productos (BEB002 y LAC002 nacen bajo el mínimo).
-- ============================================================

-- Identificar al responsable del seed en la auditoría
SELECT set_config('app.current_user', 'seed', false);

INSERT INTO categories (name) VALUES
  ('Bebidas'), ('Lácteos'), ('Snacks'), ('Limpieza'), ('Frutas'), ('Granos')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name) VALUES
  ('Distribuidora Andina'), ('Lácteos del Valle'), ('SnacksCorp'), ('Químicos del Sur')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (sku, name, category_id, price, current_stock, minimum_stock, supplier_id)
VALUES
  ('BEB001', 'Agua Mineral 500ml',
    (SELECT id FROM categories WHERE name = 'Bebidas'),  1500, 150, 50,
    (SELECT id FROM suppliers  WHERE name = 'Distribuidora Andina')),
  ('BEB002', 'Jugo de Naranja 1L',
    (SELECT id FROM categories WHERE name = 'Bebidas'),  3200,  30, 40,
    (SELECT id FROM suppliers  WHERE name = 'Lácteos del Valle')),
  ('LAC001', 'Leche Entera 1L',
    (SELECT id FROM categories WHERE name = 'Lácteos'),  2100, 200, 60,
    (SELECT id FROM suppliers  WHERE name = 'Lácteos del Valle')),
  ('LAC002', 'Yogur Natural 500g',
    (SELECT id FROM categories WHERE name = 'Lácteos'),  2800,  15, 25,
    (SELECT id FROM suppliers  WHERE name = 'Lácteos del Valle')),
  ('SNA001', 'Papas Fritas 200g',
    (SELECT id FROM categories WHERE name = 'Snacks'),   2500,  80, 30,
    (SELECT id FROM suppliers  WHERE name = 'SnacksCorp')),
  ('LIM001', 'Detergente 1L',
    (SELECT id FROM categories WHERE name = 'Limpieza'), 4500,  45, 20,
    (SELECT id FROM suppliers  WHERE name = 'Químicos del Sur'))
ON CONFLICT (sku) DO NOTHING;

-- Usuario inicial de la API (cambiar la clave en producción)
INSERT INTO users (username, password_hash, role) VALUES
  ('admin', crypt('Admin123*', gen_salt('bf')), 'ADMIN')
ON CONFLICT (username) DO NOTHING;


INSERT INTO category_sku_counters (category_id, last_seq)
SELECT
  category_id,
  COALESCE(MAX(
    CAST(regexp_replace(sku, '^[A-Za-z]+', '') AS INTEGER)
  ), 0) AS last_seq
FROM products
WHERE sku ~ '^[A-Za-z]+[0-9]+$'
GROUP BY category_id
ON CONFLICT (category_id)
  DO UPDATE SET last_seq = EXCLUDED.last_seq;
