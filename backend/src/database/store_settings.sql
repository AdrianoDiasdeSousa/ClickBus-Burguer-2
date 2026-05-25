CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name VARCHAR(120) NOT NULL DEFAULT 'ClickBus Burguer',
  category VARCHAR(80) NOT NULL DEFAULT 'Hamburgueria',
  address TEXT NOT NULL DEFAULT '',
  location TEXT,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  opening_hours TEXT NOT NULL DEFAULT '',
  business_days VARCHAR(120) NOT NULL DEFAULT '',
  manual_status VARCHAR(20) NOT NULL DEFAULT 'auto',
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT only_one_store_settings CHECK (id = 1)
);

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'Hamburgueria';

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS manual_status VARCHAR(20) NOT NULL DEFAULT 'auto';

INSERT INTO store_settings (
  id,
  store_name,
  category,
  address,
  location,
  phone,
  opening_hours,
  business_days,
  manual_status
)
VALUES (
  1,
  'ClickBus Burguer',
  'Hamburgueria',
  'Avenida Ulisses Guimarães, centro. Em frente a praça central.',
  '-12.539266,-49.928513',
  '63 999544551',
  '18:30 às 23:30',
  'Segunda à Domingo',
  'auto'
)
ON CONFLICT (id) DO NOTHING;
