"use strict";

const pool = require("../config/db");
const { obterUsuarioAutenticado } = require("./authController");

function erroHttp(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function clienteAutenticado(req) {
  const user = await obterUsuarioAutenticado(req);
  if (user.role !== "cliente") {
    throw erroHttp(403, "Apenas clientes podem gerenciar seus endereços.");
  }
  return user;
}

function validarId(value) {
  if (!/^[1-9]\d*$/.test(String(value ?? ""))) {
    throw erroHttp(400, "Identificador de endereço inválido.");
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw erroHttp(400, "Identificador de endereço inválido.");
  }
  return id;
}

function validarEndereco(value) {
  if (typeof value !== "string") {
    throw erroHttp(400, "Informe um endereço válido.");
  }
  const address = value.trim();
  if (address.length < 5 || address.length > 500) {
    throw erroHttp(400, "O endereço deve ter entre 5 e 500 caracteres.");
  }
  return address;
}

function validarCamposEndereco(body) {
  const campos = {
    cep: 9,
    street: 150,
    number: 30,
    neighborhood: 100,
    city: 100,
    state: 2,
    complement: 150,
    reference: 200,
    location: 500,
  };

  const resultado = {};

  for (const [campo, limite] of Object.entries(campos)) {
    const valor = body?.[campo];

    if (valor !== undefined && valor !== null &&
        typeof valor !== "string") {
      throw erroHttp(400, `Campo ${campo} inválido.`);
    }

    const texto = typeof valor === "string" ? valor.trim() : null;

    if (texto !== null && texto.length > limite) {
      throw erroHttp(400, `Campo ${campo} excede o limite permitido.`);
    }

    resultado[campo] = texto;
  }

  if (resultado.cep && !/^\d{5}-?\d{3}$/.test(resultado.cep)) {
    throw erroHttp(400, "Informe um CEP válido.");
  }

  if (resultado.state && !/^[A-Za-z]{2}$/.test(resultado.state)) {
    throw erroHttp(400, "Informe a sigla do estado com duas letras.");
  }

  return resultado;
}

function tratarErro(res, error, contexto) {
  if (!error.statusCode) console.error(contexto, error);
  return res.status(error.statusCode || 500).json({
    erro: error.statusCode ? error.message : "Não foi possível processar o endereço agora.",
  });
}

async function comTransacao(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await callback(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao desfazer operação de endereços:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

// Bloquear o usuário serializa alterações concorrentes no conjunto dos seus endereços.
async function bloquearCliente(client, userId) {
  const result = await client.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'cliente' FOR UPDATE",
    [userId],
  );
  if (result.rowCount !== 1) {
    throw erroHttp(401, "Conta de cliente não encontrada.");
  }
}

async function listAddresses(req, res) {
  try {
    const user = await clienteAutenticado(req);
    const result = await pool.query(
      
`SELECT
   id,
   address,
   cep,
   street,
   number,
   neighborhood,
   city,
   state,
   complement,
   reference,
   location,
   is_primary,
   created_at,
   updated_at
 FROM user_addresses
 WHERE user_id = $1
 ORDER BY is_primary DESC, created_at ASC, id ASC`,

      [user.id],
    );
    return res.json(result.rows);
  } catch (error) {
    return tratarErro(res, error, "Erro ao listar endereços:");
  }
}


async function createAddress(req, res) {
  try {
    const user = await clienteAutenticado(req);
    const address = validarEndereco(req.body?.address);
    const campos = validarCamposEndereco(req.body);

    const criado = await comTransacao(async (client) => {
      await bloquearCliente(client, user.id);

      const count = await client.query(
        "SELECT COUNT(*)::int AS total FROM user_addresses WHERE user_id = $1",
        [user.id],
      );

      const primeiro = count.rows[0].total === 0;
      const tornarPrincipal =
        primeiro || req.body?.is_primary === true;

      if (tornarPrincipal && !primeiro) {
        await client.query(
          `UPDATE user_addresses
           SET is_primary = FALSE, updated_at = NOW()
           WHERE user_id = $1 AND is_primary = TRUE`,
          [user.id],
        );
      }

      const result = await client.query(
        `INSERT INTO user_addresses (
           user_id,
           address,
           is_primary,
           cep,
           street,
           number,
           neighborhood,
           city,
           state,
           complement,
           reference,
           location
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11, $12
         )
         RETURNING
           id,
           address,
           cep,
           street,
           number,
           neighborhood,
           city,
           state,
           complement,
           reference,
           location,
           is_primary,
           created_at,
           updated_at`,
        [
          user.id,
          address,
          tornarPrincipal,
          campos.cep,
          campos.street,
          campos.number,
          campos.neighborhood,
          campos.city,
          campos.state,
          campos.complement,
          campos.reference,
          campos.location,
        ],
      );

      return result.rows[0];
    });

    return res.status(201).json(criado);
  } catch (error) {
    return tratarErro(res, error, "Erro ao cadastrar endereço:");
  }
}


async function updateAddress(req, res) {
  try {
    const user = await clienteAutenticado(req);
    const id = validarId(req.params.id);
    const address = validarEndereco(req.body?.address);
    const campos = validarCamposEndereco(req.body);

    const atualizado = await comTransacao(async (client) => {
      await bloquearCliente(client, user.id);

      const result = await client.query(
        `UPDATE user_addresses
         SET
           address = $1,
           cep = COALESCE($2, cep),
           street = COALESCE($3, street),
           number = COALESCE($4, number),
           neighborhood = COALESCE($5, neighborhood),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           complement = COALESCE($8, complement),
           reference = COALESCE($9, reference),
           location = COALESCE($10, location),
           updated_at = NOW()
         WHERE id = $11
           AND user_id = $12
         RETURNING
           id,
           address,
           cep,
           street,
           number,
           neighborhood,
           city,
           state,
           complement,
           reference,
           location,
           is_primary,
           created_at,
           updated_at`,
        [
          address,
          campos.cep,
          campos.street,
          campos.number,
          campos.neighborhood,
          campos.city,
          campos.state,
          campos.complement,
          campos.reference,
          campos.location,
          id,
          user.id,
        ],
      );

      if (result.rowCount === 0) {
        throw erroHttp(404, "Endereço não encontrado.");
      }

      return result.rows[0];
    });

    return res.json(atualizado);
  } catch (error) {
    return tratarErro(res, error, "Erro ao atualizar endereço:");
  }
}


async function setPrimaryAddress(req, res) {
  try {
    const user = await clienteAutenticado(req);
    const id = validarId(req.params.id);
    const atualizado = await comTransacao(async (client) => {
      await bloquearCliente(client, user.id);
      const encontrado = await client.query(
        "SELECT id, is_primary FROM user_addresses WHERE id = $1 AND user_id = $2",
        [id, user.id],
      );
      if (encontrado.rowCount === 0) throw erroHttp(404, "Endereço não encontrado.");
      if (!encontrado.rows[0].is_primary) {
        await client.query(
          "UPDATE user_addresses SET is_primary = FALSE, updated_at = NOW() WHERE user_id = $1 AND is_primary = TRUE",
          [user.id],
        );
        await client.query(
          "UPDATE user_addresses SET is_primary = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2",
          [id, user.id],
        );
      }
      const result = await client.query(        
`SELECT
   id,
   address,
   cep,
   street,
   number,
   neighborhood,
   city,
   state,
   complement,
   reference,
   location,
   is_primary,
   created_at,
   updated_at
 FROM user_addresses
 WHERE id = $1 AND user_id = $2`,

        [id, user.id],
      );
      return result.rows[0];
    });
    return res.json(atualizado);
  } catch (error) {
    return tratarErro(res, error, "Erro ao definir endereço principal:");
  }
}

async function deleteAddress(req, res) {
  try {
    const user = await clienteAutenticado(req);
    const id = validarId(req.params.id);
    await comTransacao(async (client) => {
      await bloquearCliente(client, user.id);
      const enderecos = await client.query(
        `SELECT id, is_primary FROM user_addresses
         WHERE user_id = $1 ORDER BY created_at ASC, id ASC`,
        [user.id],
      );
      const alvo = enderecos.rows.find((a) => a.id === id);
      if (!alvo) throw erroHttp(404, "Endereço não encontrado.");
      if (enderecos.rows.length <= 1) {
        throw erroHttp(409, "Você precisa manter pelo menos um endereço cadastrado.");
      }
      await client.query(
        "DELETE FROM user_addresses WHERE id = $1 AND user_id = $2",
        [id, user.id],
      );
      if (alvo.is_primary) {
        const proximo = enderecos.rows.find((a) => a.id !== id);
        await client.query(
          `UPDATE user_addresses SET is_primary = TRUE, updated_at = NOW()
           WHERE id = $1 AND user_id = $2`,
          [proximo.id, user.id],
        );
      }
    });
    return res.json({ mensagem: "Endereço excluído com sucesso." });
  } catch (error) {
    return tratarErro(res, error, "Erro ao excluir endereço:");
  }
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  setPrimaryAddress,
  deleteAddress,
};
