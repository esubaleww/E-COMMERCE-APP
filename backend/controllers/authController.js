import User from "../models/User.js";
import jwt from "jsonwebtoken";
import redis from "../lib/redis.js";
import { ENV } from "../lib/env.js";
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60,
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax", //if to prevent CSRF attack make it "strict"
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: "User not found" });
    if (await user.comparePassword(password)) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET);

      const key = `refresh_token:${decoded.userId}`;

      await redis.del(key);
    }

    const isProd = ENV.NODE_ENV === "production";

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    res.json({ message: "logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET);
    } catch {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      ENV.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });
    const user = await User.findById(decoded.userId).select("-password");
    res.json({ message: "Token refreshed successfully", user });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { _id, name, email, role } = req.user;
    res.json({ _id, name, email, role });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
