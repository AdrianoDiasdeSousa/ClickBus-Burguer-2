const pool = require("../config/db");

const {
  obterUsuarioAutenticado,
  obterUsuarioAdminAutenticado,
} = require("./authController");

async function createOrder(req, res) {
  let client;

  try {
    const usuario = await obterUsuarioAutenticado(req);

    if (usuario.role === "admin") {
      return res.status(403).json({
        erro: "O administrador não pode realizar pedidos.",
      });
    }

    client = await pool.connect();
    const {
      customer_email,
      customer_name,
      customer_phone,
      delivery_type,
      delivery_address,
      delivery_location,
      payment_method,
      change_for,
      total_amount,
      notes,
      items,
    } = req.body;

    if (!customer_name || !payment_method || !total_amount) {
      return res.status(400).json({
        erro: "Nome do cliente, forma de pagamento e total são obrigatórios.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        erro: "O pedido precisa ter pelo menos um item.",
      });
    }

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id,
        customer_email,
        customer_name,
        customer_phone,
        delivery_type,
        delivery_address,
        delivery_location,
        payment_method,
        change_for,
        total_amount,
        status,
        notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        usuario.id,
        customer_email || null,
        customer_name,
        customer_phone || null,
        delivery_type || "delivery",
        delivery_address || null,
        delivery_location || null,
        payment_method,
        change_for || null,
        Number(total_amount),
        "pendente",
        notes || null,
      ],
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal,
          observation
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          order.id,
          item.product_id || null,
          item.product_name,
          Number(item.quantity),
          Number(item.unit_price),
          Number(item.subtotal),
          item.observation || null,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      mensagem: "Pedido criado com sucesso.",
      order,
    });

    } catch (error) {
  if (client) {
    await client.query("ROLLBACK");
  }

  console.error("Erro ao criar pedido:", error);

  return res.status(error.statusCode || 500).json({
    erro: error.statusCode
      ? error.message
      : "Erro interno ao criar pedido.",
  });
    
  } finally {
  if (client) {
    client.release();
  }
}
}

async function listOrders(req, res) {
  try {
    const usuario = await obterUsuarioAutenticado(req);
    const ehAdmin = usuario.role === "admin";

    const result = await pool.query(
      `SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal,
              'observation', oi.observation
            )
            ORDER BY oi.id ASC
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
     FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE ($1::boolean = true OR o.user_id = $2)
GROUP BY o.id
ORDER BY o.created_at DESC`,
[ehAdmin, usuario.id],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    return res.status(error.statusCode || 500).json({
  erro: error.statusCode
    ? error.message
    : "Erro interno ao listar pedidos.",
});
  }
}

async function updateOrderStatus(req, res) {
   try {
    const usuario = await obterUsuarioAutenticado(req);
    const ehAdmin = usuario.role === "admin";

    const { id } = req.params;
    const { status, cancelled_by } = req.body;

    const statusPermitidos = [
      "pendente",
      "preparando",
      "saiu_para_entrega",
      "finalizado",
      "cancelado",
    ];

    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({
        erro: "Status inválido.",
      });
    }

    if (!ehAdmin && status !== "cancelado") {
  return res.status(403).json({
    erro: "Cliente só pode cancelar o próprio pedido.",
  });
}

const canceladoPorFinal =
  status === "cancelado"
    ? (ehAdmin ? "admin" : "cliente")
    : null;
     
    const result = await pool.query(
      `UPDATE orders
       SET
        status = $1,
        cancelled_by = $2
      WHERE id = $3
  AND (
    $4::boolean = true
    OR (
      user_id = $5
      AND status = 'pendente'
      AND $1 = 'cancelado'
    )
  )
RETURNING *`,
[status, canceladoPorFinal, id, ehAdmin, usuario.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Pedido não encontrado.",
      });
    }

    return res.json({
      mensagem: "Status do pedido atualizado com sucesso.",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);

  return res.status(error.statusCode || 500).json({
  erro: error.statusCode
    ? error.message
    : "Erro interno ao atualizar status do pedido.",
});
  }
}

async function limparPedidosFinalizados(req, res) {
  try {
    await obterUsuarioAdminAutenticado(req);

    const resultado = await pool.query(
      `DELETE FROM orders
       WHERE status IN ('finalizado', 'cancelado')
       RETURNING id`
    );

    return res.json({
      mensagem: "Pedidos concluídos e cancelados excluídos com sucesso.",
      quantidadeExcluida: resultado.rowCount,
    });
  } catch (error) {
    console.error("Erro ao limpar pedidos:", error);

    return res.status(error.statusCode || 500).json({
      erro: error.statusCode
        ? error.message
        : "Erro interno ao limpar pedidos.",
    });
  }
}

module.exports = {
  createOrder,
  listOrders,
  updateOrderStatus,
  limparPedidosFinalizados,
};
