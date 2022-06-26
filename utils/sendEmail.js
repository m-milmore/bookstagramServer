const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // create reusable transporter object using the default SMTP transport
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   auth: {
  //     user: process.env.SMTP_EMAIL,
  //     pass: process.env.SMTP_PASSWORD,
  //   },
  // });

  // I used my gmail account to send emails, I had to generate an app-specific password and use that in place of my actual password

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  // send mail with defined transport object
  const message = {
    // from: `${process.env.FROM_NAME} <${process.env.FROM_NAME}>`, // sender address
    from: `m.milmore2701@gmail.com <m.milmore2701@gmail.com>`, // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
