import { mailtrapClient, sender } from "./mailtrap.config.js";
import {
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
} from "./emailTemplates.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const response = await mailtrapClient.sendMail({
      from: sender.email,
      to: email,
      subject: "Verify Your Email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken,
      ),
    });
    console.log("Email sent successfully", response);
  } catch (error) {
    console.error(`Error sending verification email : ${error}`);
    throw new Error(`Error sending verification email : ${error}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const response = await mailtrapClient.sendMail({
      from: sender.email,
      to: email,
      subject: "Welcome to Arpit Auth Builder",
      html: `<h1>Welcome ${name}!</h1><p>Thank you for joining Arpit Auth Builder.</p>`,
    });
    console.log("Welcome email sent successfully", response);
  } catch (error) {
    console.log("Error sending welcome email", error);
    throw new Error(`Error sending welcome email : ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    const response = await mailtrapClient.sendMail({
      from: sender.email,
      to: email,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });
  } catch (error) {
    console.log("Error sending password reset email ", error);
    throw new Error(`Error sending password reset email : ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  try {
    const response = await mailtrapClient.sendMail({
      from: sender.email,
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });
    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.log("Error sending password reset success email ", error);
    throw new Error(
      `Error sending password reset success email : ${error.message}`,
    );
  }
};
