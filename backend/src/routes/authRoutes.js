const express = require("express");

const {
  register,
  login,
  getAdminProfile,
  updateAdminProfile,
  forgotPassword,
  resetPassword,
  getCustomers,
  deleteCustomer,
} = require("../controllers/authController");

const router = express.Router();

router.post("/cadastro", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/admin-profile", getAdminProfile);
router.put("/admin-profile", updateAdminProfile);

router.get("/customers", getCustomers);
router.delete("/customers/:id", deleteCustomer);

module.exports = router;
