const express = require("express");

const router = express.Router();

const {
  register,
  login,
  getLoggedInUser,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
} = require("../controllers/auth");

const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.post("/updatepassword", protect, updatePassword);
router.get("/me", protect, getLoggedInUser);
router.get("/logout", logout);
router.put("/resetpassword/:resettoken", resetPassword);
router.put("/updatedetails", protect, updateDetails);

module.exports = router;
