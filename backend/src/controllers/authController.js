const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function ensureAdminProfileSchema() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS recovery_question TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS recovery_answer_hash TEXT DEFAULT '';
  `);
}

function criarTokenUsuario(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

function obterBearerToken(req) {
  const authorization = req.headers.authorization || "";
  const partes = authorization.split(" ");

  if (partes.length === 2 && partes[0].toLowerCase() === "bearer") {
    return partes[1];
  }

  return "";
}

async function obterUsuarioAdminAutenticado(req) {
  const token = obterBearerToken(req);

  if (!token) {
    const erro = new Error("Sessão de administrador não encontrada.");
    erro.statusCode = 401;
    throw erro;
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const erro = new Error("Sessão expirada. Faça login novamente.");
    erro.statusCode = 401;
    throw erro;
  }

  if (payload.role !== "admin") {
    const erro = new Error("Apenas o administrador pode fazer essa alteração.");
    erro.statusCode = 403;
    throw erro;
  }

  const result = await pool.query(
    `SELECT id, name, email, phone, password_hash, role, address, recovery_question
     FROM users
     WHERE id = $1 AND role = 'admin'`,
    [payload.id],
  );

  if (result.rows.length === 0) {
    const erro = new Error("Administrador não encontrado.");
    erro.statusCode = 404;
    throw erro;
  }

  return result.rows[0];
}

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
    const token = criarTokenUsuario(user);

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

    const token = criarTokenUsuario(user);

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

async function getAdminProfile(req, res) {
  try {
    await ensureAdminProfileSchema();

    const admin = await obterUsuarioAdminAutenticado(req);

    return res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      recovery_question: admin.recovery_question || "",
    });
  } catch (error) {
    console.error("Erro ao buscar admin:", error);

    return res.status(error.statusCode || 500).json({
      erro: error.message || "Erro interno ao buscar administrador.",
    });
  }
}

async function updateAdminProfile(req, res) {
  try {
    await ensureAdminProfileSchema();

    const admin = await obterUsuarioAdminAutenticado(req);

    const {
      current_password,
      new_email,
      new_password,
      recovery_question,
      recovery_answer,
    } = req.body;

    if (!current_password) {
      return res.status(400).json({
        erro: "Digite a senha atual para confirmar.",
      });
    }

    const senhaAtualValida = await bcrypt.compare(
      current_password,
      admin.password_hash,
    );

    if (!senhaAtualValida) {
      return res.status(401).json({
        erro: "Senha atual incorreta.",
      });
    }

    const emailFinal = (new_email || admin.email || "").trim().toLowerCase();

    if (!emailFinal || !emailFinal.includes("@") || !emailFinal.includes(".")) {
      return res.status(400).json({
        erro: "Digite um email de administrador válido.",
      });
    }

    if (emailFinal !== admin.email) {
      const emailExists = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id <> $2",
        [emailFinal, admin.id],
      );

      if (emailExists.rows.length > 0) {
        return res.status(409).json({
          erro: "Já existe uma conta usando esse email.",
        });
      }
    }

    if (new_password && String(new_password).length < 4) {
      return res.status(400).json({
        erro: "A nova senha precisa ter pelo menos 4 caracteres.",
      });
    }

    if (!recovery_question || !recovery_answer) {
      return res.status(400).json({
        erro: "Preencha a pergunta e a resposta de recuperação.",
      });
    }

    const senhaHashFinal = new_password
      ? await bcrypt.hash(String(new_password), 10)
      : admin.password_hash;

    const respostaHash = await bcrypt.hash(
      String(recovery_answer).trim().toLowerCase(),
      10,
    );

    const result = await pool.query(
      `UPDATE users
       SET
        email = $1,
        password_hash = $2,
        recovery_question = $3,
        recovery_answer_hash = $4
       WHERE id = $5 AND role = 'admin'
       RETURNING id, name, email, phone, role, address, created_at, recovery_question`,
      [
        emailFinal,
        senhaHashFinal,
        String(recovery_question).trim(),
        respostaHash,
        admin.id,
      ],
    );

    const user = result.rows[0];
    const token = criarTokenUsuario(user);

    return res.json({
      mensagem: "Conta do administrador atualizada com sucesso.",
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
      recovery_question: user.recovery_question || "",
    });
  } catch (error) {
    console.error("Erro ao atualizar admin:", error);

    return res.status(error.statusCode || 500).json({
      erro: error.message || "Erro interno ao atualizar administrador.",
    });
  }
}

module.exports = {
  register,
  login,
  getAdminProfile,
  updateAdminProfile,
};
