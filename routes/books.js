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
  verifyMimeType,
  updateBook,
} = require("../controllers/books");

const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(filteredResults(Book), getBooks)
  .post(protect, authorize("publisher", "admin"), addBook);

router
  .route("/:id")
  .get(getBook)
  .put(protect, authorize("publisher", "admin"), updateBook)
  .delete(protect, authorize("publisher", "admin"), deleteBook);

router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), bookUploadPhoto);

router.post("/verify", verifyMimeType);

module.exports = router;
