import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emails.js";

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    let user = await User.findOne({ email });
    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    if (user) {
      if (user.isVerified) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }
      // If user exists but is NOT verified, update account and issue a new verification code
      user.name = name;
      user.password = hashedPassword;
      user.verificationToken = verificationToken;
      user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    } else {
      user = new User({
        email,
        password: hashedPassword,
        name,
        verificationToken,
        verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
    }

    await user.save();

    //jwt
    generateTokenAndSetCookie(res, user._id);

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error("Email sending failed during signup.", emailError);
      return res.status(500).json({
        success: false,
        message: `Failed to send verification email: ${emailError.message}`,
      });
    }

    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    res.status(201).json({
      success: true,
      message: "Verification code sent to email",
      user: safeUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resendVerification = async (req, res) => {
  try {
    let user;
    if (req.userId) {
      user = await User.findById(req.userId);
    }
    if (!user && req.body.email) {
      user = await User.findOne({ email: req.body.email });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Account is already verified" });
    }

    const verificationToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification code resent successfully",
    });
  } catch (error) {
    console.error("Error in resendVerification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (welcomeErr) {
      console.error("Failed to send welcome email (non-fatal):", welcomeErr);
    }

    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    res.json({
      success: true,
      message: "Email verified successfully",
      user: safeUser,
    });
  } catch (error) {
    console.log("Error in verifyEmail", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log(`Error in login : ${error}`);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    try {
      await sendPasswordResetEmail(
        user.email,
        `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`,
      );
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
      return res.status(500).json({
        success: false,
        message: `Failed to send password reset email: ${emailErr.message}`,
      });
    }

    res.json({ success: true, message: "Password reset link sent to email" });
  } catch (error) {
    console.log(`Error in forgot password `, error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    try {
      await sendResetSuccessEmail(user.email);
    } catch (emailErr) {
      console.error("Failed to send reset success email (non-fatal):", emailErr);
    }

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not Found" });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
