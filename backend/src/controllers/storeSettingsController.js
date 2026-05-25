const pool = require("../config/db");

async function getStoreSettings(req, res) {
  try {
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
    const {
      store_name,
      category,
      address,
      location,
      phone,
      opening_hours,
      business_days,
      manual_status,
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
  getStoreSettings,
  updateStoreSettings,
};
