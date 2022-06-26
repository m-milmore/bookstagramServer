const express = require("express");

const router = express.Router();

const {
  register,
  login,
  getLoggedInUser,
  getLoggedInUserByEmail,
  getLoggedInUserByParamEmail,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
} = require("../controllers/auth");

const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);
router.put("/updatedetails", protect, updateDetails);
router.post("/updatepassword", protect, updatePassword);
router.get("/me", protect, getLoggedInUser);
router.get("/whoami", protect, getLoggedInUserByEmail);
router.get("/:email", protect, getLoggedInUserByParamEmail);

module.exports = router;
