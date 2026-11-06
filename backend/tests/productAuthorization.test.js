
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

// Segredo exclusivo dos testes.
// Nunca utilizar o JWT_SECRET de producao.
process.env.JWT_SECRET = "segredo-isolado-para-testes-2026";

// Banco de dados simulado.
// Nao abre conexao com PostgreSQL.
const consultas = [];

const bancoSimulado = {
  async query(sql, parametros = []) {
    consultas.push({ sql, parametros });

    if (
      sql.includes("FROM users") &&
      sql.includes("role = 'admin'")
    ) {
      return {
        rows: [
          {
            id: 1,
            name: "Admin Teste",
            email: "admin@exemplo.test",
            role: "admin",
          },
        ],
      };
    }

    if (sql.includes("INSERT INTO products")) {
      return {
        rows: [
          {
            id: 100,
            name: "Produto Teste",
            price: 10,
          },
        ],
      };
    }

    if (sql.includes("UPDATE products")) {
      return {
        rows: [
          {
            id: 100,
            name: "Produto Teste",
            price: 10,
          },
        ],
      };
    }

    if (sql.includes("DELETE FROM products")) {
      return {
        rows: [{ id: 100 }],
      };
    }

    throw new Error("Consulta inesperada no teste.");
  },
};

// Substitui dependencias antes de carregar os controllers.
function simularModulo(caminho, exportacoes) {
  const arquivo = require.resolve(caminho);

  require.cache[arquivo] = {
    id: arquivo,
    filename: arquivo,
    loaded: true,
    exports: exportacoes,
  };
}

simularModulo("../src/config/db", bancoSimulado);

simularModulo("../src/services/emailService", {
  enviarEmailRecuperacao: async () => {
    throw new Error("Envio de email proibido durante testes.");
  },
});

const {
  obterUsuarioAdminAutenticado,
} = require("../src/controllers/authController");

const {
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../src/controllers/productController");

// Cria um JWT ficticio assinado pelo segredo de teste.
function gerarToken(role) {
  return jwt.sign(
    {
      id: 1,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

function criarRequisicao(token) {
  return {
    headers: token
      ? { authorization: `Bearer ${token}` }
      : {},
    params: { id: "100" },
    body: {
      name: "Produto Teste",
      description: "Produto ficticio",
      price: 10,
      category: "lanche",
      available: true,
    },
  };
}

// Simula os metodos de resposta do Express.
function criarResposta() {
  return {
    statusCode: 200,
    body: null,

    status(codigo) {
      this.statusCode = codigo;
      return this;
    },

    json(dados) {
      this.body = dados;
      return this;
    },
  };
}

const operacoes = [
  {
    nome: "criar produto",
    funcao: createProduct,
    sucesso: 201,
    comando: "INSERT INTO products",
  },
  {
    nome: "editar produto",
    funcao: updateProduct,
    sucesso: 200,
    comando: "UPDATE products",
  },
  {
    nome: "excluir produto",
    funcao: deleteProduct,
    sucesso: 200,
    comando: "DELETE FROM products",
  },
];

// Testa diretamente a funcao real de autenticacao.
test("Autenticacao: sem JWT retorna 401", async () => {
  consultas.length = 0;

  await assert.rejects(
    obterUsuarioAdminAutenticado(criarRequisicao()),
    (erro) => erro.statusCode === 401,
  );

  assert.equal(consultas.length, 0);
});

test("Autenticacao: JWT invalido retorna 401", async () => {
  consultas.length = 0;

  await assert.rejects(
    obterUsuarioAdminAutenticado(
      criarRequisicao("token-invalido"),
    ),
    (erro) => erro.statusCode === 401,
  );

  assert.equal(consultas.length, 0);
});

test("Autenticacao: cliente retorna 403", async () => {
  consultas.length = 0;

  await assert.rejects(
    obterUsuarioAdminAutenticado(
      criarRequisicao(gerarToken("cliente")),
    ),
    (erro) => erro.statusCode === 403,
  );

  assert.equal(consultas.length, 0);
});

// Testa as tres operacoes reais do productController.
for (const operacao of operacoes) {
  test(`${operacao.nome}: bloqueia sem JWT`, async () => {
    consultas.length = 0;

    const req = criarRequisicao();
    const res = criarResposta();

    await operacao.funcao(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(consultas.length, 0);
  });

  test(`${operacao.nome}: bloqueia JWT invalido`, async () => {
    consultas.length = 0;

    const req = criarRequisicao("token-invalido");
    const res = criarResposta();

    await operacao.funcao(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(consultas.length, 0);
  });

  test(`${operacao.nome}: bloqueia cliente`, async () => {
    consultas.length = 0;

    const req = criarRequisicao(gerarToken("cliente"));
    const res = criarResposta();

    await operacao.funcao(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(consultas.length, 0);
  });

  test(`${operacao.nome}: autoriza administrador`, async () => {
    consultas.length = 0;

    const req = criarRequisicao(gerarToken("admin"));
    const res = criarResposta();

    await operacao.funcao(req, res);

    assert.equal(res.statusCode, operacao.sucesso);

    assert.equal(
      consultas.some((consulta) =>
        consulta.sql.includes(operacao.comando),
      ),
      true,
    );

    assert.equal(
      consultas.some((consulta) =>
        consulta.sql.includes("FROM users"),
      ),
      true,
    );
  });
}
