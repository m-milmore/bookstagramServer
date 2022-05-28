const express = require("express");
const router = express.Router();

const {
  getBooks,
  getBook,
  addBook,
  deleteBook,
  bookUploadPhoto,
} = require("../controllers/books");

router.route("/").get(getBooks).post(addBook);

router.route("/:id").get(getBook).delete(deleteBook);

router.route("/:id/photo").put(bookUploadPhoto);

module.exports = router;
