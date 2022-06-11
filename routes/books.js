const express = require("express");
const router = express.Router();
const filteredResults = require("../middleware/filteredResults");
const Book = require("../models/Book");

const {
  getBooks,
  getBook,
  addBook,
  deleteBook,
  bookUploadPhoto,
} = require("../controllers/books");

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(filteredResults(Book), getBooks)
  .post(protect, authorize("publisher", "admin"), addBook);

router
  .route("/:id")
  .get(getBook)
  .delete(protect, authorize("publisher", "admin"), deleteBook);

router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), bookUploadPhoto);

module.exports = router;
