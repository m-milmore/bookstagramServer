const path = require("path");
const Book = require("../models/Book");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc		Get all books
// @routes	GET /api/v1/books
// @access	PUBLIC
exports.getBooks = asyncHandler(async (req, res, next) => {
  let query;
  const reqQuery = { ...req.query };
  const removeFields = ["select", "sort", "limit", "page"];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = Book.find(JSON.parse(queryStr));

  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  //Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 0;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Book.countDocuments();

  query = query.skip(startIndex).limit(limit);

  const pagination = {};

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  const books = await query;
  res
    .status(200)
    .json({ success: true, count: books.length, pagination, data: books });
});

// @desc		Get single book
// @routes	GET /api/v1/books/:id
// @access	PUBLIC
exports.getBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(
      new ErrorResponse(`Book with id ${req.params.id} not found`, 404)
    );
  }
  res.status(200).json({ success: true, data: book });
});

// @desc		Create new book
// @routes	POST /api/v1/books
// @access	PRIVATE
exports.addBook = asyncHandler(async (req, res, next) => {
  const book = await Book.create(req.body);
  res.status(201).json({ success: true, data: book });
});

// @desc		Delete book
// @routes	DELETE /api/v1/books/:id
// @access	PRIVATE
exports.deleteBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    return next(
      new ErrorResponse(`Book with id ${req.params.id} not found`, 404)
    );
  }
  res.status(200).json({
    success: true,
    msg: `Book with id ${req.params.id} deleted successfully`,
  });
});

// @desc		Upload book photo
// @routes	PUT /api/v1/books/:id/photo
// @access	PRIVATE
exports.bookUploadPhoto = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(
      new ErrorResponse(`Book with id ${req.params.id} not found`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(
      new ErrorResponse(
        `Please upload an image file that is less than ${
          process.env.MAX_FILE_SIZE / 1000000
        }MB in size`,
        400
      )
    );
  }

  file.name = `photo_${book.id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      next(new ErrorResponse(`Problem with file upload`, 500));
    }
    await Book.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(200).json({ success: true, data: file.name });
  });
});
