const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// @desc		Register user
// @routes	POST /api/v1/auth/register
// @access	PUBLIC
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  let user = await User.create({
    name,
    email,
    password,
  });

  user = await User.findById(user.id).select("-password");

  sendTokenResponse(user, 200, res);
});

// @desc		Login user
// @routes	POST /api/v1/auth/login
// @access	PUBLIC
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password"));
  }

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  user = await User.findOne({ email });

  sendTokenResponse(user, 200, res);
});

// @desc		Logout user
// @routes	GET /api/v1/auth/logout
// @access	PUBLIC
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
});

// @desc		Get logged in user by id
// @routes	GET /api/v1/auth/me
// @access	PRIVATE
exports.getLoggedInUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// @desc		Get logged in user by email
// @routes	GET /api/v1/auth/whoami
// @access	PRIVATE
exports.getLoggedInUserByEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.user.email });
  res.status(200).json({ success: true, data: user });
});

// @desc		Get logged in user by email as param
// @routes	GET /api/v1/auth/email
// @access	PRIVATE
exports.getLoggedInUserByParamEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.params.email });
  res.status(200).json({ success: true, data: user });
});

// @desc		Update user details
// @routes	PUT /api/v1/auth/updatedetails
// @access	PRIVATE
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: user });
});

// @desc		Update user password
// @routes	POST /api/v1/auth/updatepassword
// @access	PRIVATE
exports.updatePassword = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id).select("+password");

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Incorrect password", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  user = await User.findById(user.id).select("-password");

  sendTokenResponse(user, 200, res);
});

// @desc		Forgot password
// @routes	POST /api/v1/auth/forgotpassword
// @access	PRIVATE
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // const resetUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/auth/resetpassword/${resetToken}`;

  const resetUrl = `${req.body.urlLink}${resetToken}`;

  const message = `You are receiving this email because you requested a password reset. Please click on this link to reset your password: ${resetUrl}`;

  const options = {
    email: user.email,
    subject: "Password reset",
    message,
  };

  try {
    await sendEmail(options);
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpired = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse("Email could not be sent", 500));
  }

  // res.status(200).json({ success: true, data: user });
});

// @desc		reset password
// @routes	PUT /api/v1/auth/resetpassword/:resettoken
// @access	PUBLIC
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  let user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpired: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpired = undefined;
  await user.save();

  user = await User.findById(user.id).select("-password");

  sendTokenResponse(user, 200, res);
});

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwt();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token, data: user });
};
