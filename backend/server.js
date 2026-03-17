import express from "express";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cookieParser from "cookie-parser";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import cors from "cors";
import path from "path";
import { ENV } from "./lib/env.js";

const app = express();
const _dirname = path.resolve();
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(_dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(_dirname, "/frontend/dist/index.html"));
  });
}

app.listen(5000, () => {
  connectDB();
  console.log(`Server is running on port ${ENV.PORT || 5000}`);
});
