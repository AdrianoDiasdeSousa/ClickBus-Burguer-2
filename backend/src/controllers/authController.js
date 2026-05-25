const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function register(req, res) {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        erro: "Nome, email e senha são obrigatórios.",
      });
    }

    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({
        erro: "Já existe uma conta com este email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
        (name, email, phone, password_hash, role, address)
       VALUES 
        ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, address, created_at`,
      [name, email, phone || null, passwordHash, "cliente", address || null],
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      token,
      user,
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);

    return res.status(500).json({
      erro: "Erro interno ao cadastrar usuário.",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios.",
      });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: "Email ou senha inválidos.",
      });
    }

    const user = result.rows[0];

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsValid) {
      return res.status(401).json({
        erro: "Email ou senha inválidos.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.json({
      mensagem: "Login realizado com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      erro: "Erro interno ao fazer login.",
    });
  }
}

module.exports = {
  register,
  login,
};
