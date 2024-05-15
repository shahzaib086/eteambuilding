const express = require("express");

const {
  loginView,
  loginUser,
  logout
} = require("../controllers/admin/adminLoginController");

const router = express.Router();

// router.get("/register", registerView);
router.get("/login", loginView);

// router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/logout", logout);

module.exports = router;