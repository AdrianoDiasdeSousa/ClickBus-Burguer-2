const express = require("express");

const {
  createOrder,
  listOrders,
  updateOrderStatus,
  limparPedidosFinalizados,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);
router.get("/", listOrders);
router.put("/:id/status", updateOrderStatus);

router.delete("/finalizados", limparPedidosFinalizados);

module.exports = router;
