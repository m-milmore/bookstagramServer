const allowedOrigins = require("./allowedOrigins");

const whitelist = [
  "https://www.yoursite.com",
  "http://localhost:3000", // leave out after development is done
  "http://localhost:5000", // leave out after development is done
  "https://mmci-album-01.s3.amazonaws.com/album1", // to get the images on aws
];

// remove !origin after development
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
