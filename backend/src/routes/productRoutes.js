
const express = require("express");

const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);

// Rota para salvar a ordem completa dos produtos.
router.put("/reorder", reorderProducts);

router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
