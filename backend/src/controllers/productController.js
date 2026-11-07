const pool = require("../config/db");
const { obterUsuarioAdminAutenticado } = require("./authController");

async function listProducts(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        name,
        description,
        price,
        category,
        image_url,
        available,
        display_order,
        admin_notice,
        created_at
      FROM products
      ORDER BY category ASC, display_order ASC, id ASC`,
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);

    return res.status(500).json({
      erro: "Erro interno ao listar produtos.",
    });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id,
        name,
        description,
        price,
        category,
        image_url,
        available,
        created_at
      FROM products
      WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Produto não encontrado.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao buscar produto.",
    });
  }
}

async function createProduct(req, res) {
  try {
     await obterUsuarioAdminAutenticado(req);
    const { name, description, price, category, image_url, available } =
      req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        erro: "Nome e preço são obrigatórios.",
      });
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        erro: "Preço inválido.",
      });
    }

    const result = await pool.query(
      `INSERT INTO products 
        (name, description, price, category, image_url, available)
       VALUES 
        ($1, $2, $3, $4, $5, $6)
       RETURNING 
        id,
        name,
        description,
        price,
        category,
        image_url,
        available,
        created_at`,
      [
        name,
        description || null,
        numericPrice,
        category || null,
        image_url || null,
        available === undefined ? true : Boolean(available),
      ],
    );

    return res.status(201).json({
      mensagem: "Produto cadastrado com sucesso.",
      product: result.rows[0],
    });
 
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({
        erro: error.message,
      });
    }

    console.error("Erro ao criar produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao criar produto.",
    });
  }
}

async function updateProduct(req, res) {
  try {
    await obterUsuarioAdminAutenticado(req);
    const { id } = req.params;

    const {
      name,
      description,
      price,
      category,
      image_url,
      available,
      display_order,
      admin_notice,
    } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        erro: "Nome e preço são obrigatórios.",
      });
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        erro: "Preço inválido.",
      });
    }

    const result = await pool.query(
      `UPDATE products
   SET
    name = $1,
    description = $2,
    price = $3,
    category = $4,
    image_url = $5,
    available = $6,
    display_order = $7,
    admin_notice = $8
   WHERE id = $9
   RETURNING 
    id,
    name,
    description,
    price,
    category,
    image_url,
    available,
    display_order,
    admin_notice,
    created_at`,
      [
        name,
        description || null,
        numericPrice,
        category || null,
        image_url || null,
        available === undefined ? true : Boolean(available),
        display_order === undefined ? Number(id) : Number(display_order),
        admin_notice || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Produto não encontrado.",
      });
    }

    return res.json({
      mensagem: "Produto atualizado com sucesso.",
      product: result.rows[0],
    });
 
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({
        erro: error.message,
      });
    }

    console.error("Erro ao atualizar produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao atualizar produto.",
    });
  }

}


async function deleteProduct(req, res) {
  try {
    // Verifica se o usuário é administrador
    await obterUsuarioAdminAutenticado(req);

    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Produto não encontrado.",
      });
    }

    return res.json({
      mensagem: "Produto excluído com sucesso.",
    });

  } catch (error) {
    // Erros de autenticação e permissão
    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({
        erro: error.message,
      });
    }

    // Outros erros internos
    console.error("Erro ao excluir produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao excluir produto.",
    });
  }
}

async function reorderProducts(req, res) {
  let client;

  try {
    await obterUsuarioAdminAutenticado(req);

    const { category, productIds } = req.body || {};

    if (
      !["lanche", "bebida"].includes(category) ||
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      !productIds.every(
        (id) => Number.isSafeInteger(id) && id > 0
      ) ||
      new Set(productIds).size !== productIds.length
    ) {
      return res.status(400).json({
        erro: "Categoria ou lista de produtos inválida.",
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    // Impede que duas reorganizações sejam
    // executadas simultaneamente por esta rota.
    await client.query(
      "SELECT pg_advisory_xact_lock(725311)"
    );

    // Bloqueia os produtos da categoria durante
    // a atualização da sequência.
    const resultado = await client.query(
      `SELECT id
       FROM products
       WHERE category = $1
       ORDER BY id
       FOR UPDATE`,
      [category]
    );

    const idsBanco = resultado.rows.map(
      (produto) => Number(produto.id)
    );

    const idsRecebidos = new Set(productIds);

    // Exige todos os produtos da categoria,
    // sem IDs extras e sem produtos faltando.
    const listaValida =
      idsBanco.length === productIds.length &&
      idsBanco.every((id) => idsRecebidos.has(id));

    if (!listaValida) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        erro:
          "A lista de produtos mudou. Atualize o cardápio e tente novamente.",
      });
    }

    for (let i = 0; i < productIds.length; i++) {
      await client.query(
        `UPDATE products
         SET display_order = $1
         WHERE id = $2 AND category = $3`,
        [i + 1, productIds[i], category]
      );
    }

    await client.query("COMMIT");

    return res.json({
      mensagem: "Ordem dos produtos atualizada com sucesso.",
      category,
      productIds,
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Erro ao desfazer transação:", rollbackError);
      }
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({
        erro: error.message,
      });
    }

    console.error("Erro ao reordenar produtos:", error);

    return res.status(500).json({
      erro: "Não foi possível atualizar a ordem dos produtos.",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
};

