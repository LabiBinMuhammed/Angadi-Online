-- ═══════════════════════════════════════════════════════════════════════════
-- Village Market — Complete Database Schema
-- PostgreSQL / Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enums ──────────────────────────────────────────────────────────────────
 
CREATE TYPE user_role       AS ENUM ('customer', 'shop_owner', 'admin');
CREATE TYPE sell_mode       AS ENUM ('manual', 'packed', 'dynamic', 'portion');
CREATE TYPE variant_type    AS ENUM ('manual', 'packed', 'dynamic', 'portion');
CREATE TYPE order_status    AS ENUM ('pending', 'packing', 'delivering', 'delivered', 'cancelled');
CREATE TYPE order_item_status AS ENUM ('pending', 'adjusted', 'approved', 'rejected');
CREATE TYPE item_status     AS ENUM ('draft', 'incomplete', 'ready', 'published', 'hidden', 'rejected', 'out_of_stock');

-- ─── Users ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT      NOT NULL,
    phone      TEXT      UNIQUE NOT NULL,
    role       user_role NOT NULL DEFAULT 'customer',
    is_active  BOOLEAN   DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE user_profiles (
    user_id            UUID PRIMARY KEY,
    email              TEXT,
    profile_image_url  TEXT,
    gender             TEXT,
    date_of_birth      DATE,
    preferred_language TEXT,
    created_at         TIMESTAMP DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Locations ──────────────────────────────────────────────────────────────

CREATE TABLE locations (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      TEXT,
    latitude  NUMERIC(9,6),
    longitude NUMERIC(9,6),
    type      TEXT
);

-- ─── Addresses ──────────────────────────────────────────────────────────────

CREATE TABLE user_addresses (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID    NOT NULL,
    label           TEXT    NOT NULL,
    contact_name    TEXT    NOT NULL,
    contact_phone   TEXT    NOT NULL,
    address_line_1  TEXT    NOT NULL,
    address_line_2  TEXT,
    landmark        TEXT,
    location_id     UUID,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    is_default      BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT now(),
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- ─── Shops ──────────────────────────────────────────────────────────────────

CREATE TABLE shops (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    location_id UUID,
    type        TEXT,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now(),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE shop_owners (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    user_id UUID NOT NULL,
    UNIQUE (shop_id, user_id),
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Categories & Units ─────────────────────────────────────────────────────

CREATE TABLE categories (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    updated_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE unit_groups (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE units (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT    NOT NULL,
    symbol          TEXT    NOT NULL,
    unit_group_id   UUID    NOT NULL,
    base_multiplier NUMERIC NOT NULL,
    updated_at      TIMESTAMP DEFAULT now(),
    FOREIGN KEY (unit_group_id) REFERENCES unit_groups(id)
);

CREATE TABLE category_unit_groups (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID NOT NULL UNIQUE,
    unit_group_id UUID NOT NULL,
    FOREIGN KEY (category_id)   REFERENCES categories(id)   ON DELETE CASCADE,
    FOREIGN KEY (unit_group_id) REFERENCES unit_groups(id)
);

-- ─── Items ──────────────────────────────────────────────────────────────────

CREATE TABLE items (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id      UUID        NOT NULL,
    category_id  UUID,
    demo_item_id UUID,
    name         TEXT        NOT NULL,
    description  TEXT,
    status       item_status DEFAULT 'draft',
    has_variants BOOLEAN     DEFAULT FALSE,
    demo_version INTEGER     DEFAULT 1,
    translations JSONB       DEFAULT '{}'::jsonb,
    deleted_at   TIMESTAMP   NULL,
    updated_at   TIMESTAMP   DEFAULT now(),
    FOREIGN KEY (shop_id)     REFERENCES shops(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE item_sell_config (
    id                          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id                     UUID      NOT NULL UNIQUE,
    sell_mode                   sell_mode NOT NULL,
    base_unit_id                UUID,
    price_per_base_unit         NUMERIC   CHECK (price_per_base_unit >= 0),
    max_price_increase_percent  NUMERIC   CHECK (max_price_increase_percent BETWEEN 0 AND 100),
    max_price_limit             NUMERIC   CHECK (max_price_limit >= 0),
    allow_custom_quantity       BOOLEAN   DEFAULT FALSE,
    created_at                  TIMESTAMP DEFAULT now(),
    FOREIGN KEY (item_id)      REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (base_unit_id) REFERENCES units(id)
);

CREATE TABLE item_variants (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id      UUID         NOT NULL,
    variant_type variant_type NOT NULL,
    label        TEXT         NOT NULL,
    unit_id      UUID,
    value        NUMERIC      CHECK (value > 0),
    price        NUMERIC      CHECK (price >= 0),
    min_value    NUMERIC,
    max_value    NUMERIC,
    is_default   BOOLEAN      DEFAULT FALSE,
    is_active    BOOLEAN      DEFAULT TRUE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    CHECK (min_value IS NULL OR max_value IS NULL OR min_value < max_value)
);

CREATE TABLE item_images (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     UUID    NOT NULL,
    image_url   TEXT    NOT NULL,
    is_primary  BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0,
    alt_text    TEXT,
    created_at  TIMESTAMP DEFAULT now(),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ─── Demo Items (template catalog) ─────────────────────────────────────────

CREATE TABLE demo_items (
    id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID,
    name          TEXT      NOT NULL,
    unit_id       UUID,
    sell_mode     sell_mode NOT NULL,
    default_image TEXT,
    demo_version  INTEGER   DEFAULT 1,
    translations  JSONB     DEFAULT '{}'::jsonb,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (unit_id)     REFERENCES units(id)
);



-- ─── Orders ─────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID         NOT NULL,
    shop_id               UUID         NOT NULL,
    total_estimated_price NUMERIC      CHECK (total_estimated_price >= 0),
    total_final_price     NUMERIC      CHECK (total_final_price >= 0),
    payment_type          TEXT         CHECK (payment_type IN ('cod', 'credit')),
    status                order_status DEFAULT 'pending',
    created_at            TIMESTAMP    DEFAULT now(),
    updated_at            TIMESTAMP    DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES shops(id)
);

CREATE TABLE order_addresses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL UNIQUE,
    label          TEXT DEFAULT 'Home',
    contact_name   TEXT NOT NULL,
    contact_phone  TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark       TEXT,
    latitude       NUMERIC(9,6),
    longitude      NUMERIC(9,6),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID              NOT NULL,
    item_id          UUID              NOT NULL,
    variant_id       UUID              NOT NULL,
    variant_type     variant_type,
    requested_value  NUMERIC,
    estimated_price  NUMERIC           NOT NULL,
    actual_value     NUMERIC,
    final_price      NUMERIC           NOT NULL,
    max_allowed_price NUMERIC,
    auto_approved    BOOLEAN           DEFAULT FALSE,
    status           order_item_status DEFAULT 'pending',
    FOREIGN KEY (order_id)   REFERENCES orders(id)        ON DELETE CASCADE,
    FOREIGN KEY (item_id)    REFERENCES items(id),
    FOREIGN KEY (variant_id) REFERENCES item_variants(id)
);

-- ─── Credit ─────────────────────────────────────────────────────────────────

CREATE TABLE shop_user_credit (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id             UUID    NOT NULL,
    user_id             UUID    NOT NULL,
    is_credit_enabled   BOOLEAN DEFAULT FALSE,
    credit_limit        NUMERIC CHECK (credit_limit >= 0),
    used_amount         NUMERIC DEFAULT 0 CHECK (used_amount >= 0),
    is_blocked          BOOLEAN DEFAULT FALSE,
    last_credit_used_at TIMESTAMP,
    created_at          TIMESTAMP DEFAULT now(),
    UNIQUE (shop_id, user_id),
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_credit_limit CHECK (
        credit_limit IS NULL OR used_amount <= credit_limit
    )
);

-- ─── Price Adjustment Log ───────────────────────────────────────────────────

CREATE TABLE price_adjustment_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID,
    estimated_price NUMERIC,
    final_price   NUMERIC,
    difference    NUMERIC,
    created_at    TIMESTAMP DEFAULT now(),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Triggers — auto-update updated_at
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger — auto-create user_profiles row on new user insert
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_user_profile
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_user_profiles_user_id           ON user_profiles(user_id);
CREATE INDEX idx_user_addresses_user_id          ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_location_id      ON user_addresses(location_id);
CREATE INDEX idx_shop_owners_shop_id             ON shop_owners(shop_id);
CREATE INDEX idx_shop_owners_user_id             ON shop_owners(user_id);
CREATE INDEX idx_shops_location_id              ON shops(location_id);
CREATE INDEX idx_units_unit_group_id            ON units(unit_group_id);
CREATE INDEX idx_category_unit_groups_cat_id    ON category_unit_groups(category_id);
CREATE INDEX idx_category_unit_groups_ug_id     ON category_unit_groups(unit_group_id);
CREATE INDEX idx_items_shop_id                  ON items(shop_id);
CREATE INDEX idx_items_category_id             ON items(category_id);
CREATE INDEX idx_items_deleted_at              ON items(deleted_at);
CREATE INDEX idx_item_sell_config_item_id      ON item_sell_config(item_id);
CREATE INDEX idx_item_sell_config_base_unit_id ON item_sell_config(base_unit_id);
CREATE INDEX idx_item_variants_item_id         ON item_variants(item_id);
CREATE INDEX idx_item_variants_unit_id         ON item_variants(unit_id);
CREATE INDEX idx_item_images_item_id           ON item_images(item_id);
CREATE INDEX idx_demo_items_category_id        ON demo_items(category_id);
CREATE INDEX idx_demo_items_unit_id            ON demo_items(unit_id);

CREATE INDEX idx_orders_user_id               ON orders(user_id);
CREATE INDEX idx_orders_shop_id              ON orders(shop_id);
CREATE INDEX idx_orders_status              ON orders(status);
CREATE INDEX idx_order_addresses_order_id  ON order_addresses(order_id);
CREATE INDEX idx_order_items_order_id      ON order_items(order_id);
CREATE INDEX idx_order_items_item_id       ON order_items(item_id);
CREATE INDEX idx_order_items_variant_id    ON order_items(variant_id);
CREATE INDEX idx_shop_user_credit_shop_id  ON shop_user_credit(shop_id);
CREATE INDEX idx_shop_user_credit_user_id  ON shop_user_credit(user_id);
CREATE INDEX idx_price_adj_logs_oi_id     ON price_adjustment_logs(order_item_id);
