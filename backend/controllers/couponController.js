import Coupon from "../models/Coupon.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon controller:", error.message);
    res.status(500).json({ message: "Server errror:", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({
      code,
      userId: req.user._id,
      isActive: true,
    });
    if (!coupon) {
      return res.status(401).json({ message: "Coupon not found" });
    }
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }
    res.json({
      message: "coupon is valid",
      code: coupon.code,
      discountPersentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error in validateCoupon controller:", error.message);
    res.status(500).json({ message: "Server errror:", error: error.message });
  }
};
