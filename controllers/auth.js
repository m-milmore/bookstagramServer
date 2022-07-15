const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// @desc		Register user
// @routes	POST /api/v1/auth/register
// @access	PUBLIC
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // validated in the User Schema, email & password are required
  let user = await User.create({
    name,
    email,
    password,
  });

  user = await User.findById(user.id);

  sendTokenResponse(user, 201, res);
});

// @desc		Login user
// @routes	POST /api/v1/auth/login, data send via req.body and not via url attached
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
// maybe put the rest of the values at null for that user with the refreshToken
exports.logout = asyncHandler(async (req, res, next) => {
  const cookies = req.cookies;

  if (!cookies || !cookies.refresh) {
    return res.sendStatus(204); // No Content
  }

  const refreshToken = cookies.refresh;

  let user = await User.findOne({ refreshToken });

  if (user) {
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
  }

  const options = {
    httpOnly: true,
    // sameSite: "None",
    // secure: true,
  };

  // requires to use only https servers
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
    options.sameSite = "None";
  }

  res
    .status(200)
    .cookie("refresh", "none", options)
    .json({ success: true, data: {} });
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

  user = await User.findById(user.id);

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
    user.resetPasswordToken = undefined;
    user.resetPasswordExpired = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse("Email could not be sent", 500));
  }
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

  user = await User.findById(user.id);

  sendTokenResponse(user, 200, res);
});

// @desc		verify refresh token and if ok send access token
// @routes	GET /api/v1/auth/refresh
// @access	PRIVATE
exports.verifyRefreshToken = asyncHandler(async (req, res, next) => {
  console.log("in verify refresh");
  const cookies = req.cookies;

  if (!cookies || !cookies.refresh) {
    return next(new ErrorResponse("Unauthorized (cookie not found)", 401));
  }
  const refreshToken = cookies.refresh;
  console.log("RT: ", refreshToken);

  let user = await User.findOne({ refreshToken });

  if (!user) {
    return next(new ErrorResponse("Forbidden", 403));
  }
  console.log("user", user);

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  user = await User.findById(decoded.id);
    console.log("user", user);

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  console.log("New AT: ", token)

  res.status(200).json({ success: true, token, data: user });
});

const sendTokenResponse = async (user, statusCode, res) => {
  const token = user.getSignedJwt();
  await user.save({ validateBeforeSave: false });
  userLight = await User.findById(user.id); // to exclude the refreshToken in the json but not in the cookie

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 60 * 60 * 1000),
    httpOnly: true,
    // sameSite: "None",
    // secure: true,
    maxAge: 60 * 60 * 1000,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
    options.sameSite = "None";
  }

  res
    .status(statusCode)
    .cookie("refresh", user.refreshToken, options)
    .json({ success: true, token, data: userLight });
};
