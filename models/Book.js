const mongoose = require("mongoose");
const slugify = require("slugify");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title for the book image"],
    unique: true,
    trim: true,
    maxlength: [50, "Maximum length for title is 50 characters"],
  },
  slug: String,
  photo: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

BookSchema.pre("save", function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

module.exports = mongoose.model("Book", BookSchema);
