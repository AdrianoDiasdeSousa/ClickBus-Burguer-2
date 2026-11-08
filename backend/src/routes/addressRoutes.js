
const express = require("express");
const router = express.Router();

const {
  listAddresses,
  createAddress,
  updateAddress,
  setPrimaryAddress,
  deleteAddress,
} = require("../controllers/addressController");

// Todas as operações exigirão autenticação
// no controller e serão limitadas ao próprio cliente.
router.get("/", listAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.patch("/:id/primary", setPrimaryAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
