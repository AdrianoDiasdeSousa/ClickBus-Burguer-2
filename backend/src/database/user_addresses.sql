
CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_addresses_address_not_blank
        CHECK (length(btrim(address)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id
ON user_addresses(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_addresses_one_primary
ON user_addresses(user_id)
WHERE is_primary = TRUE;

ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS cep VARCHAR(9),
  ADD COLUMN IF NOT EXISTS street VARCHAR(150),
  ADD COLUMN IF NOT EXISTS number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(2),
  ADD COLUMN IF NOT EXISTS complement VARCHAR(150),
  ADD COLUMN IF NOT EXISTS reference VARCHAR(200),
  ADD COLUMN IF NOT EXISTS location TEXT;
