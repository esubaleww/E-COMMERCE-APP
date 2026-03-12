import express from "express";

import {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecomendedProducts,
  getProductsByCategory,
  toggleFeaturedProducts,
} from "../controllers/productController.js";
import { protectRoute, adminRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecomendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProducts);

export default router;
