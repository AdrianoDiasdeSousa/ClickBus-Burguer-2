
"use strict";

const express = require("express");

const {
  register,
  login,
  getMyProfile,
  getAdminProfile,
  updateAdminProfile,
  forgotPassword,
  resetPassword,
  getCustomers,
  deleteCustomer,
} = require("../controllers/authController");

const router = express.Router();

// Cadastro e autenticação
router.post("/cadastro", register);
router.post("/login", login);

// Meu Perfil: dados do cliente autenticado
router.get("/me", getMyProfile);

// Recuperação de senha
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Perfil administrativo
router.get("/admin-profile", getAdminProfile);
router.put("/admin-profile", updateAdminProfile);

// Gerenciamento de clientes pelo administrador
router.get("/customers", getCustomers);
router.delete("/customers/:id", deleteCustomer);

module.exports = router;

