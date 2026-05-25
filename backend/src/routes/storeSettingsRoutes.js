const express = require("express");

const {
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/storeSettingsController");

const router = express.Router();

router.get("/", getStoreSettings);
router.put("/", updateStoreSettings);

module.exports = router;
