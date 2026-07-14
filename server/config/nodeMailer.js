import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const isMock =
  !process.env.SMTP_USER ||
  process.env.SMTP_USER === "your_email" ||
  process.env.SMTP_USER.trim() === "" ||
  !process.env.SMTP_PASS ||
  process.env.SMTP_PASS === "your_password" ||
  process.env.SMTP_PASS.trim() === "";

let transporter;

if (isMock) {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️ CRITICAL WARNING: SMTP is running in mock mode in PRODUCTION! Real emails will NOT be sent.",
    );
  } else {
    console.log("ℹ️ SMTP is in mock mode (console logging for emails)");
  }

  transporter = {
    verify: (callback) => {
      if (typeof callback === "function") callback(null, true);
    },
    sendMail: async (options) => {
      console.log("=========================================");
      console.log("✉️ MOCK EMAIL SENT");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("Content:");
      console.log(options.text || options.html);
      console.log("=========================================");
      return { messageId: "mock-id-" + Date.now() };
    },
  };
} else {
  let host = process.env.SMTP_HOST;
  if (!host) {
    if (process.env.SMTP_USER && process.env.SMTP_USER.endsWith("@gmail.com")) {
      host = "smtp.gmail.com";
    } else {
      host = "smtp-relay.brevo.com";
    }
  }
  let port = parseInt(process.env.SMTP_PORT || "587", 10);
  if (isNaN(port)) {
    console.warn(
      `⚠️ Invalid SMTP_PORT specified: "${process.env.SMTP_PORT}". Defaulting to 587.`,
    );
    port = 587;
  }
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (process.env.NODE_ENV !== "test") {
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP Connection Error:", error);
      } else {
        console.log("✅ SMTP Server is ready to send emails!");
      }
    });
  }
}

export default transporter;
