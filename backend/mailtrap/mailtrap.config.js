import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const mailtrapClient = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_TOKEN,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

export const sender = {
  email: process.env.GMAIL_USER,
  name: "Arpit Gupta",
};
