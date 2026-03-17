import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  createCheckoutSession,
  checkoutSuccess,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);
router.post("/test", (req, res) => {
  res.json({ success: true });
});

export default router;
