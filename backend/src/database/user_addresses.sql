
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

-- Preserva os endereços existentes.
INSERT INTO user_addresses (user_id, address, is_primary)
SELECT id, address, TRUE
FROM users
WHERE role = 'cliente'
  AND address IS NOT NULL
  AND length(btrim(address)) > 0
  AND NOT EXISTS (
      SELECT 1
      FROM user_addresses
      WHERE user_addresses.user_id = users.id
  );
