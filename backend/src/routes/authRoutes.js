const express = require("express");
const {
  register,
  login,
  getAdminProfile,
  updateAdminProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/cadastro", register);
router.post("/login", login);
router.get("/admin-profile", getAdminProfile);
router.put("/admin-profile", updateAdminProfile);

module.exports = router;
