CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE movement_types (
  id          SMALLINT PRIMARY KEY,
  code        VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(100) NOT NULL
);
INSERT INTO movement_types (id, code, description) VALUES
  (1, 'ENTRADA', 'Entrada de mercadería (aumento de stock)'),
  (2, 'SALIDA',  'Salida de mercadería (disminución de stock)');

CREATE TABLE alert_types (
  id          SMALLINT PRIMARY KEY,
  code        VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(100) NOT NULL
);
INSERT INTO alert_types (id, code, description) VALUES
  (1, 'STOCK_BAJO', 'El stock actual es igual o inferior al stock mínimo');

CREATE TABLE alert_statuses (
  id          SMALLINT PRIMARY KEY,
  code        VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(100) NOT NULL
);
INSERT INTO alert_statuses (id, code, description) VALUES
  (1, 'ACTIVA',   'Alerta vigente, pendiente de resolución'),
  (2, 'RESUELTA', 'El stock volvió a superar el mínimo');

CREATE TABLE order_statuses (
  id          SMALLINT PRIMARY KEY,
  code        VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(100) NOT NULL
);
INSERT INTO order_statuses (id, code, description) VALUES
  (1, 'PENDIENTE', 'Creada, a la espera de aprobación'),
  (2, 'APROBADA',  'Aprobada para compra'),
  (3, 'RECHAZADA', 'Rechazada con motivo'),
  (4, 'RECIBIDA',  'Mercadería recibida, stock actualizado');


CREATE TABLE categories (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE products (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uid           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sku           VARCHAR(20)  NOT NULL UNIQUE
                CHECK (sku ~ '^[A-Za-z0-9]{6,20}$'),
  name          VARCHAR(100) NOT NULL
                CHECK (char_length(name) BETWEEN 3 AND 100),
  category_id   BIGINT NOT NULL REFERENCES categories(id),
  price         NUMERIC(12,2) NOT NULL CHECK (price > 0),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock INTEGER NOT NULL CHECK (minimum_stock > 0),
  supplier_id   BIGINT NOT NULL REFERENCES suppliers(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_supplier ON products (supplier_id);
CREATE INDEX idx_products_stock    ON products (current_stock);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE inventory_movements (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uid              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  product_id       BIGINT NOT NULL REFERENCES products(id),
  movement_type_id SMALLINT NOT NULL REFERENCES movement_types(id),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  reason           VARCHAR(255) NOT NULL,
  stock_after      INTEGER NOT NULL CHECK (stock_after >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_product ON inventory_movements (product_id, created_at DESC);


CREATE OR REPLACE FUNCTION prevent_movement_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Los movimientos de inventario son inmutables (Regla de Negocio 6)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movements_immutable
  BEFORE UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION prevent_movement_mutation();

CREATE TABLE alerts (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uid             UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  product_id      BIGINT NOT NULL REFERENCES products(id),
  alert_type_id   SMALLINT NOT NULL REFERENCES alert_types(id)    DEFAULT 1,
  alert_status_id SMALLINT NOT NULL REFERENCES alert_statuses(id) DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  CHECK (alert_status_id <> 2 OR resolved_at IS NOT NULL)
);


CREATE UNIQUE INDEX uq_alerts_one_active_per_product
  ON alerts (product_id) WHERE alert_status_id = 1;

CREATE INDEX idx_alerts_status ON alerts (alert_status_id);


CREATE TABLE purchase_orders (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uid              UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  product_id       BIGINT NOT NULL REFERENCES products(id),
  supplier_id      BIGINT NOT NULL REFERENCES suppliers(id),
  alert_id         BIGINT REFERENCES alerts(id),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  order_status_id  SMALLINT NOT NULL REFERENCES order_statuses(id) DEFAULT 1,
  rejection_reason VARCHAR(255)
                   CHECK (order_status_id <> 3 OR char_length(rejection_reason) >= 10),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at      TIMESTAMPTZ,
  received_at      TIMESTAMPTZ
);

CREATE INDEX idx_orders_product ON purchase_orders (product_id);
CREATE INDEX idx_orders_status  ON purchase_orders (order_status_id);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE products_audit (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_id   BIGINT NOT NULL,
  operation   VARCHAR(10) NOT NULL,
  data_before JSONB,
  data_after  JSONB,
  changed_by  VARCHAR(100) NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alerts_audit (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_id   BIGINT NOT NULL,
  operation   VARCHAR(10) NOT NULL,
  data_before JSONB,
  data_after  JSONB,
  changed_by  VARCHAR(100) NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_orders_audit (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_id   BIGINT NOT NULL,
  operation   VARCHAR(10) NOT NULL,
  data_before JSONB,
  data_after  JSONB,
  changed_by  VARCHAR(100) NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_audit_record ON products_audit (record_id, changed_at DESC);
CREATE INDEX idx_alerts_audit_record   ON alerts_audit (record_id, changed_at DESC);
CREATE INDEX idx_orders_audit_record   ON purchase_orders_audit (record_id, changed_at DESC);


CREATE OR REPLACE FUNCTION audit_row_change() RETURNS trigger AS $$
DECLARE
  v_user      VARCHAR(100);
  v_record_id BIGINT;
BEGIN
  v_user := COALESCE(NULLIF(current_setting('app.current_user', true), ''), 'sistema');
  v_record_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;

  EXECUTE format(
    'INSERT INTO %I (record_id, operation, data_before, data_after, changed_by)
     VALUES ($1, $2, $3, $4, $5)',
    TG_TABLE_NAME || '_audit'
  )
  USING v_record_id,
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        v_user;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_audit
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER trg_alerts_audit
  AFTER INSERT OR UPDATE OR DELETE ON alerts
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER trg_purchase_orders_audit
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uid           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
CREATE OR REPLACE FUNCTION manage_stock_alerts() RETURNS trigger AS $$
BEGIN
  IF NEW.current_stock <= NEW.minimum_stock THEN
    INSERT INTO alerts (product_id, alert_type_id, alert_status_id)
    VALUES (NEW.id, 1, 1)
    ON CONFLICT (product_id) WHERE alert_status_id = 1 DO NOTHING;
  ELSE
    UPDATE alerts
    SET alert_status_id = 2, resolved_at = now()
    WHERE product_id = NEW.id AND alert_status_id = 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_stock_alerts
  AFTER INSERT OR UPDATE OF current_stock, minimum_stock ON products
  FOR EACH ROW EXECUTE FUNCTION manage_stock_alerts();


-- Contador de secuencia por categoría para generar los SKU.
-- Se declara ANTES de la función/trigger que la usan.
CREATE TABLE IF NOT EXISTS category_sku_counters (
  category_id BIGINT PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE,
  last_seq    INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.generate_product_sku()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  cat_name text;
  cat_code text;
  seq_num  int;
BEGIN
  IF NEW.sku IS NOT NULL AND NEW.sku <> '' THEN
    RETURN NEW;
  END IF;

  SELECT name INTO cat_name
  FROM categories
  WHERE id = NEW.category_id;

  cat_code := upper(
    left(
      regexp_replace(
        translate(cat_name, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
        '[^A-Za-z0-9]', '', 'g'
      ),
      3
    )
  );
  cat_code := coalesce(nullif(cat_code, ''), 'CAT');

  INSERT INTO category_sku_counters (category_id, last_seq)
  VALUES (NEW.category_id, 1)
  ON CONFLICT (category_id)
    DO UPDATE SET last_seq = category_sku_counters.last_seq + 1
  RETURNING last_seq INTO seq_num;

  NEW.sku := cat_code || lpad(seq_num::text, 3, '0');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_products_generate_sku
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION generate_product_sku();
