const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");
const fileupload = require("express-fileupload");
const mongoSanitize = require("express-mongo-sanitize"); // "email": "{$gt}" : ""
const helmet = require("helmet"); // security to headers
const xss = require("xss-clean"); // prevents script tags in req.body
const hpp = require("hpp"); // params pollution
const cors = require("cors"); // if client on one url and server on another
const corsOptions = require("./config/corsOptions");
const rateLimit = require("express-rate-limit"); // limits the number of request per a certain time

// Dave Gray starts
const credentials = require("./middleware/credentials")
const { format } = require("date-fns");
const { logger } = require("./middleware/logEvents");

const EventEmitter = require("events"); // Commonjs core module
class Emitter extends EventEmitter {}

// initialize object
const myEmitter = new Emitter();

//add listener for the log event
// myEmitter.on("log", (msg) => logEvents(msg));

// emit event
// myEmitter.emit("log", "Log event emitted");

//Dave Gray ends

const path = require("path");
const cookieParser = require("cookie-parser");
dotenv.config({ path: "./config/config.env" });

connectDB();

// Route files
const books = require("./routes/books");
const auth = require("./routes/auth");
const users = require("./routes/users");

const app = express();

// Parse JSON
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(fileupload());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(hpp());

// custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per "window" (here, per 10 minutes)
});

app.use(limiter);

// built-in middleware, any resources required by any other resources will be looked up in this folder by the app
app.use(express.static(path.join(__dirname, "public")));

// Mount Routers
app.use("/api/v1/books", books);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(format(new Date(), "yyyyMMdd\tHH:mm:ss")), // Dave Gray,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
