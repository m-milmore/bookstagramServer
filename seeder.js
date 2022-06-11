const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// load environment variables
dotenv.config({ path: "./config/config.env" });

// load models
const Book = require("./models/Book");
const User = require("./models/User");

// connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// read json
const books = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/books.json`, "utf-8")
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8")
);

// import into database
const importData = async () => {
  try {
    await Book.create(books);
    // await User.create(users);
    console.log("data imported...");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// delete data
const deleteData = async () => {
  try {
    await Book.deleteMany();
    await User.deleteMany();
    console.log("data deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// node seeder.js -i or node seeder.js -d
if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
