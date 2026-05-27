const pool = require("../config/db");

async function ensureStoreSettingsSchema() {
  await pool.query(`
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
      sharing_title TEXT DEFAULT '',
      delivery_area VARCHAR(120) DEFAULT '',
      published_link TEXT DEFAULT '',
      share_message_client TEXT DEFAULT '',
      share_message_admin TEXT DEFAULT '',
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT only_one_store_settings CHECK (id = 1)
    );
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS category VARCHAR(80) NOT NULL DEFAULT 'Hamburgueria';
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS manual_status VARCHAR(20) NOT NULL DEFAULT 'auto';
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS sharing_title TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS delivery_area VARCHAR(120) DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS published_link TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS share_message_client TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS share_message_admin TEXT DEFAULT '';
  `);

  await pool.query(`
    INSERT INTO store_settings (
      id,
      store_name,
      category,
      address,
      location,
      phone,
      opening_hours,
      business_days,
      manual_status,
      sharing_title,
      delivery_area,
      published_link,
      share_message_client,
      share_message_admin
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
      'auto',
      'ClickBus Burguer | Delivery em Sandolândia | Pedido online',
      'Sandolândia',
      '',
      '🍔 Olha essa hamburgueria aqui: ClickBus Burguer!\n\nDá para fazer pedido pelo cardápio online.',
      '🍔 ClickBus Burguer | Delivery em Sandolândia\n\nFaça seu pedido pelo cardápio digital e receba no conforto da sua casa.'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function getStoreSettings(req, res) {
  try {
    await ensureStoreSettingsSchema();

    const result = await pool.query(
      `SELECT
        id,
        store_name,
        category,
        address,
        location,
        phone,
        opening_hours,
        business_days,
        manual_status,
        sharing_title,
        delivery_area,
        published_link,
        share_message_client,
        share_message_admin,
        updated_at
      FROM store_settings
      WHERE id = 1`,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Configurações da loja não encontradas.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar configurações da loja:", error);

    return res.status(500).json({
      erro: "Erro interno ao buscar configurações da loja.",
      detalhe: error.message,
    });
  }
}

async function updateStoreSettings(req, res) {
  try {
    await ensureStoreSettingsSchema();

    const {
      store_name,
      category,
      address,
      location,
      phone,
      opening_hours,
      business_days,
      manual_status,
      sharing_title,
      delivery_area,
      published_link,
      share_message_client,
      share_message_admin,
    } = req.body;

    const statusPermitidos = ["auto", "aberta", "fechada"];

    if (manual_status && !statusPermitidos.includes(manual_status)) {
      return res.status(400).json({
        erro: "Status manual inválido.",
      });
    }

    const result = await pool.query(
      `UPDATE store_settings
       SET
        store_name = COALESCE($1, store_name),
        category = COALESCE($2, category),
        address = COALESCE($3, address),
        location = COALESCE($4, location),
        phone = COALESCE($5, phone),
        opening_hours = COALESCE($6, opening_hours),
        business_days = COALESCE($7, business_days),
        manual_status = COALESCE($8, manual_status),
        sharing_title = COALESCE($9, sharing_title),
        delivery_area = COALESCE($10, delivery_area),
        published_link = COALESCE($11, published_link),
        share_message_client = COALESCE($12, share_message_client),
        share_message_admin = COALESCE($13, share_message_admin),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING
        id,
        store_name,
        category,
        address,
        location,
        phone,
        opening_hours,
        business_days,
        manual_status,
        sharing_title,
        delivery_area,
        published_link,
        share_message_client,
        share_message_admin,
        updated_at`,
      [
        store_name || null,
        category || null,
        address || null,
        location || null,
        phone || null,
        opening_hours || null,
        business_days || null,
        manual_status || null,
        sharing_title === undefined ? null : sharing_title,
        delivery_area === undefined ? null : delivery_area,
        published_link === undefined ? null : published_link,
        share_message_client === undefined ? null : share_message_client,
        share_message_admin === undefined ? null : share_message_admin,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Configurações da loja não encontradas.",
      });
    }

    return res.json({
      mensagem: "Configurações da loja atualizadas com sucesso.",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações da loja:", error);

    return res.status(500).json({
      erro: "Erro interno ao atualizar configurações da loja.",
      detalhe: error.message,
    });
  }
}

module.exports = {
  ensureStoreSettingsSchema,
  getStoreSettings,
  updateStoreSettings,
};
