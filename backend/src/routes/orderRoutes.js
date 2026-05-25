const express = require("express");

const {
  createOrder,
  listOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);
router.get("/", listOrders);
router.put("/:id/status", updateOrderStatus);

module.exports = router;
