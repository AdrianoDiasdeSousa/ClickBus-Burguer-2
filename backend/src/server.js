const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const storeRoutes = require("./routes/storeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const storeSettingsRoutes = require("./routes/storeSettingsRoutes");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");

const app = express();

app.use(cors());

// Aumenta o limite para permitir salvar imagens em base64.
// Isso resolve o erro 413 Payload Too Large ao editar imagem do produto.
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/store-settings", storeSettingsRoutes);

app.get("/", (req, res) => {
  res.json({
    mensagem: "API ClickBus Burguer rodando com sucesso",
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    projeto: "ClickBus Burguer",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS agora");

    res.json({
      mensagem: "Conexão com PostgreSQL funcionando",
      banco_horario: result.rows[0].agora,
    });
  } catch (error) {
    console.error("Erro ao conectar no banco:", error.message);

    res.status(500).json({
      erro: "Erro ao conectar no PostgreSQL",
      detalhe: error.message,
    });
  }
});

// Tratamento simples para JSON grande demais ou inválido.
// Ajuda o front-end a receber JSON em vez de uma página HTML de erro.
app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      erro: "A imagem enviada é muito grande. Use uma imagem menor.",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      erro: "JSON inválido enviado para o servidor.",
    });
  }

  next(error);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
