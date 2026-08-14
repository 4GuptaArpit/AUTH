import { mailtrapClient, sender } from "./mailtrap.config.js";
import {
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
} from "./emailTemplates.js";

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Auth App <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || JSON.stringify(data));
    }
    return data;
  }

  return await mailtrapClient.sendMail({
    from: sender.email,
    to,
    subject,
    html,
  });
};

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const response = await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken,
      ),
    });
    console.log("Email sent successfully", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error(error.message || "Failed to send email via provider");
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const response = await sendEmail({
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
    const response = await sendEmail({
      to: email,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });
    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.log("Error sending password reset email ", error);
    throw new Error(`Error sending password reset email : ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  try {
    const response = await sendEmail({
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });
    console.log("Password reset success email sent successfully", response);
  } catch (error) {
    console.log("Error sending password reset success email ", error);
    throw new Error(
      `Error sending password reset success email : ${error.message}`,
    );
  }
};
