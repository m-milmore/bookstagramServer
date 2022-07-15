const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc		Get all users
// @routes	GET /api/v1/users
// @access	PRIVATE/ADMIN
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.filteredResults);
});

// @desc		Get single user
// @routes	GET /api/v1/users/:id
// @access	PRIVATE/ADMIN
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("No user found"), 404);
  }

  res.status(200).json({ success: true, data: user });
});

// @desc		Create User
// @routes	POST /api/v1/users
// @access	PRIVATE/ADMIN
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

// @desc		Update User
// @routes	PUT /api/v1/users/:id
// @access	PRIVATE/ADMIN
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: user });
});

// @desc		Delete User
// @routes	DELETE /api/v1/users/:id
// @access	PRIVATE/ADMIN
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
});
