import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const mailtrapClient = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_TOKEN,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export const sender = {
  email: process.env.GMAIL_USER,
  name: "Arpit Gupta",
};
