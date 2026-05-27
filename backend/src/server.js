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
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
