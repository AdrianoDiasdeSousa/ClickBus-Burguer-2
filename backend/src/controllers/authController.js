const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { enviarEmailRecuperacao } = require("../services/emailService");

async function ensureAdminProfileSchema() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS recovery_question TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS recovery_answer_hash TEXT DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
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

async function obterUsuarioAutenticado(req) {
  const token = obterBearerToken(req);

  if (!token) {
    const erro = new Error("Faça login para continuar.");
    erro.statusCode = 401;
    throw erro;
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const erro = new Error("Sessão inválida ou expirada.");
    erro.statusCode = 401;
    throw erro;
  }

  const resultado = await pool.query(
    `SELECT id, name, email, role
     FROM users
     WHERE id = $1`,
    [payload.id],
  );

  if (resultado.rows.length === 0) {
    const erro = new Error("Usuário não encontrado.");
    erro.statusCode = 401;
    throw erro;
  }

  return resultado.rows[0];
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
   WHERE id = $1
     AND role = 'admin'
     AND is_active = TRUE`,
  [payload.id]
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
const { name, email, phone, password, address, cpf } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        erro: "Nome, email e senha são obrigatórios.",
      });
    }

const cpfLimpo = typeof cpf === "string"
  ? cpf.replace(/\D/g, "")
  : "";

function cpfValido(numero) {
  if (!/^\d{11}$/.test(numero)) return false;
  if (new Set(numero).size === 1) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = numero
      .slice(0, tamanho)
      .split("")
      .reduce(
        (total, digito, indice) =>
          total + Number(digito) * (tamanho + 1 - indice),
        0
      );

    const resto = (soma * 10) % 11;
    const verificador = resto === 10 ? 0 : resto;

    if (verificador !== Number(numero[tamanho])) {
      return false;
    }
  }

  return true;
}

if (!cpfValido(cpfLimpo)) {
  return res.status(400).json({
    erro: "Informe um CPF válido.",
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


const cpfExists = await pool.query(
  `SELECT id
   FROM users
   WHERE regexp_replace(
     COALESCE(cpf, ''), '[^0-9]', '', 'g'
   ) = $1
   LIMIT 1`,
  [cpfLimpo]
);

if (cpfExists.rows.length > 0) {
  return res.status(409).json({
    erro: "Já existe uma conta cadastrada com este CPF.",
  });
}

    
    const passwordHash = await bcrypt.hash(password, 10);
 
const result = await pool.query(
  `INSERT INTO users
    (name, email, phone, password_hash, role, address, cpf)
   VALUES
    ($1, $2, $3, $4, $5, $6, $7)
   RETURNING id, name, email, phone, role, address, cpf, created_at`,
  [
    name,
    email,
    phone || null,
    passwordHash,
    "cliente",
    address || null,
    cpfLimpo,
  ],
);

    const user = result.rows[0];
    const token = criarTokenUsuario(user);

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      token,
      user,
    });
    
} catch (error) {
  if (error.code === "23505") {
    return res.status(409).json({
      erro: "Já existe uma conta com este CPF ou email.",
    });
  }

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


if (
  new_password !== undefined &&
  new_password !== null &&
  new_password !== "" &&
  (
    typeof new_password !== "string" ||
    new_password.length < 10
  )
) {
  return res.status(400).json({
    erro: "A nova senha precisa ter pelo menos 10 caracteres.",
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

async function forgotPassword(req, res) {
  try {
    await ensureAdminProfileSchema();

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return res.status(400).json({
        erro: "Digite um email válido.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    // Mensagem genérica para não revelar se o email existe ou não.
    const mensagem =
      "Se este email estiver cadastrado, enviaremos um link para redefinir a senha.";

    if (result.rows.length === 0) {
      return res.json({ mensagem });
    }

    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id, tokenHash],
    );

    const frontendUrl =
      process.env.FRONTEND_URL || "https://click-bus-burguer.vercel.app";

    const link = `${frontendUrl}/redefinir-senha.html?token=${token}`;

    await enviarEmailRecuperacao({
      para: user.email,
      nome: user.name,
      link,
    });

    return res.json({ mensagem });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);

    return res.status(500).json({
      erro: "Não foi possível enviar o email de recuperação agora.",
    });
  }
}

async function resetPassword(req, res) {
  let client;
  let transacaoIniciada = false;

  try {
    await ensureAdminProfileSchema();

    const token = req.body?.token;
    const newPassword = req.body?.new_password;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      return res.status(400).json({
        erro: "Token e nova senha são obrigatórios.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        erro: "A nova senha precisa ter pelo menos 6 caracteres.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    client = await pool.connect();

    await client.query("BEGIN");
    transacaoIniciada = true;

    // Bloqueia o token e o usuario durante a redefinicao.
    const tokenResult = await client.query(
      `SELECT
         prt.id,
         prt.user_id,
         u.role
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC
       LIMIT 1
       FOR UPDATE OF prt, u`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      const erro = new Error(
        "Link inválido ou expirado. Solicite uma nova recuperação."
      );
      erro.statusCode = 400;
      throw erro;
    }

    const resetToken = tokenResult.rows[0];

    // Administradores precisam de senha mais longa.
    const tamanhoMinimo =
      resetToken.role === "admin" ? 10 : 6;

    if (newPassword.length < tamanhoMinimo) {
      const erro = new Error(
        `A nova senha precisa ter pelo menos ${tamanhoMinimo} caracteres.`
      );
      erro.statusCode = 400;
      throw erro;
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      10
    );

    await client.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );

    const tokenAtualizado = await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1
         AND used_at IS NULL
       RETURNING id`,
      [resetToken.id]
    );

    if (tokenAtualizado.rowCount !== 1) {
      throw new Error(
        "Nao foi possivel finalizar a recuperacao."
      );
    }

    await client.query("COMMIT");
    transacaoIniciada = false;

    return res.json({
      mensagem:
        "Senha redefinida com sucesso. Já pode fazer login.",
    });

  } catch (error) {
    if (client && transacaoIniciada) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Erro ao desfazer recuperacao de senha:",
          rollbackError
        );
      }
    }

    if (error.statusCode === 400) {
      return res.status(400).json({
        erro: error.message,
      });
    }

    console.error(
      "Erro ao redefinir senha:",
      error
    );

    return res.status(500).json({
      erro:
        "Não foi possível redefinir a senha agora.",
    });

  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getCustomers(req, res) {
  try {
    // Garante que somente o administrador tenha acesso.
    await obterUsuarioAdminAutenticado(req);

    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        address,
        created_at
      FROM users
      WHERE role = 'cliente'
      ORDER BY created_at DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);

    return res.status(error.statusCode || 500).json({
      erro: error.message || "Erro interno ao buscar clientes.",
    });
  }
}

async function deleteCustomer(req, res) {
  try {
    // Garante que somente o administrador tenha acesso.
    await obterUsuarioAdminAutenticado(req);

    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        erro: "Cliente inválido.",
      });
    }

    const customerResult = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1 AND role = 'cliente'
       LIMIT 1`,
      [customerId],
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        erro: "Cliente não encontrado.",
      });
    }

    await pool.query(
      `DELETE FROM users
       WHERE id = $1 AND role = 'cliente'`,
      [customerId],
    );

    return res.json({
      mensagem: "Cliente excluído com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);

    return res.status(error.statusCode || 500).json({
      erro: error.message || "Erro interno ao excluir cliente.",
    });
  }
}


async function getMyProfile(req, res) {
  try {
    const usuario = await obterUsuarioAutenticado(req);

    if (usuario.role !== "cliente") {
      return res.status(403).json({
        erro: "Apenas clientes podem acessar este perfil.",
      });
    }

    const resultado = await pool.query(
      `SELECT id, name, cpf, email, phone
       FROM users
       WHERE id = $1
         AND role = 'cliente'
         AND is_active = TRUE`,
      [usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        erro: "Conta de cliente não encontrada ou inativa.",
      });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({
        erro: error.message,
      });
    }

    console.error("Erro ao consultar Meu Perfil:", error);

    return res.status(500).json({
      erro: "Não foi possível carregar seus dados pessoais.",
    });
  }
}

function validarCpfPerfil(cpf) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (new Set(cpf).size === 1) return false;

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = cpf
      .slice(0, tamanho)
      .split("")
      .reduce(
        (total, digito, indice) =>
          total + Number(digito) * (tamanho + 1 - indice),
        0
      );

    const resto = (soma * 10) % 11;
    const verificador = resto === 10 ? 0 : resto;

    if (verificador !== Number(cpf[tamanho])) {
      return false;
    }
  }

  return true;
}

async function updateMyProfile(req, res) {
  let client;
  let transacaoIniciada = false;

  try {
    const autenticado = await obterUsuarioAutenticado(req);

    if (autenticado.role !== "cliente") {
      return res.status(403).json({
        erro: "Apenas clientes podem editar este perfil.",
      });
    }

    const { name, email, phone, cpf, current_password } =
      req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof cpf !== "string"
    ) {
      return res.status(400).json({
        erro: "Informe nome, email, telefone e CPF válidos.",
      });
    }

    const nomeFinal = name.trim();
    const emailFinal = email.trim().toLowerCase();
    const telefoneFinal = phone.trim();
    const cpfFinal = cpf.replace(/\D/g, "");

    if (nomeFinal.length < 3 || nomeFinal.length > 150) {
      return res.status(400).json({
        erro: "Informe um nome entre 3 e 150 caracteres.",
      });
    }

    if (
      emailFinal.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFinal)
    ) {
      return res.status(400).json({
        erro: "Informe um email válido.",
      });
    }

    if (
      telefoneFinal.length < 8 ||
      telefoneFinal.length > 30
    ) {
      return res.status(400).json({
        erro: "Informe um telefone válido.",
      });
    }

    if (cpfFinal && !validarCpfPerfil(cpfFinal)) {
      return res.status(400).json({
        erro: "Informe um CPF válido.",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transacaoIniciada = true;

    const resultadoAtual = await client.query(
      `SELECT id, cpf, password_hash
       FROM users
       WHERE id = $1
         AND role = 'cliente'
         AND is_active = TRUE
       FOR UPDATE`,
      [autenticado.id]
    );

    if (resultadoAtual.rowCount !== 1) {
      return res.status(401).json({
        erro: "Conta de cliente não encontrada ou inativa.",
      });
    }

    const usuarioAtual = resultadoAtual.rows[0];
    const cpfAnterior = String(usuarioAtual.cpf || "")
      .replace(/\D/g, "");

    if (cpfAnterior && !cpfFinal) {
      return res.status(400).json({
        erro: "O CPF cadastrado não pode ser apagado.",
      });
    }

    
    const alterouCpf = cpfFinal !== cpfAnterior;

    // A confirmação da alteração de CPF será feita
    // por um aviso na página Meu Perfil.
    // Não é necessário informar a senha atual.

    const emailExistente = await client.query(
      `SELECT id FROM users
       WHERE LOWER(email) = $1
         AND id <> $2
       LIMIT 1`,
      [emailFinal, autenticado.id]
    );

    if (emailExistente.rowCount > 0) {
      return res.status(409).json({
        erro: "Este email já está cadastrado em outra conta.",
      });
    }

    if (cpfFinal) {
      const cpfExistente = await client.query(
        `SELECT id FROM users
         WHERE regexp_replace(
           COALESCE(cpf, ''), '[^0-9]', '', 'g'
         ) = $1
           AND id <> $2
         LIMIT 1`,
        [cpfFinal, autenticado.id]
      );

      if (cpfExistente.rowCount > 0) {
        return res.status(409).json({
          erro: "Este CPF já está cadastrado em outra conta.",
        });
      }
    }

    const atualizado = await client.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           phone = $3,
           cpf = $4
       WHERE id = $5
         AND role = 'cliente'
         AND is_active = TRUE
       RETURNING id, name, cpf, email, phone`,
      [
        nomeFinal,
        emailFinal,
        telefoneFinal,
        cpfFinal || null,
        autenticado.id,
      ]
    );

    await client.query("COMMIT");
    transacaoIniciada = false;

    return res.json({
      mensagem: "Dados pessoais atualizados com sucesso.",
      usuario: atualizado.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        erro: "CPF ou email já cadastrado em outra conta.",
      });
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(error.statusCode).json({
        erro: error.message,
      });
    }

    console.error("Erro ao atualizar Meu Perfil:", error);

    return res.status(500).json({
      erro: "Não foi possível atualizar seus dados pessoais.",
    });
  } finally {
    if (client) {
      if (transacaoIniciada) {
        try {
          await client.query("ROLLBACK");
        } catch (erroRollback) {
          console.error("Erro ao desfazer atualização:", erroRollback);
        }
      }
      client.release();
    }
  }
}

module.exports = {
  register,
  login,
  getMyProfile,
  updateMyProfile,
  getAdminProfile,
  updateAdminProfile,
  forgotPassword,
  resetPassword,
  getCustomers,
  deleteCustomer,
  obterUsuarioAutenticado,
  obterUsuarioAdminAutenticado,
};
