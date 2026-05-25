const pool = require("../config/db");

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
    console.error("Erro ao criar produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao criar produto.",
    });
  }
}

async function updateProduct(req, res) {
  try {
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
    console.error("Erro ao atualizar produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao atualizar produto.",
    });
  }
}

async function deleteProduct(req, res) {
  try {
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
    console.error("Erro ao excluir produto:", error);

    return res.status(500).json({
      erro: "Erro interno ao excluir produto.",
    });
  }
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
