import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  loading: false,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const res = await axios.get("/coupons");
      set({ coupon: res.data });
    } catch {
      console.log("Error fetching coupon", error);
    }
  },

  applyCoupon: async (code) => {
    try {
      const res = await axios.post("/coupons/validate", { code });
      set({ coupon: res.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully", {
        id: "apply_coupon_success",
      });
    } catch {
      toast.error(error.response?.data?.message || "Failed to apply coupon", {
        id: "apply_coupon_error",
      });
    }
  },

  removeCoupon: async (code) => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed", { id: "remove_coupon_successs" });
  },

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(
        error.response?.data.message || "Error occured in get cart items",
        { id: "get_cart_error" },
      );
    }
  },
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
  },
  addToCart: async (product) => {
    set({ loading: true });
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart", { id: "add_cart_success" });
      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id,
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.error, { id: "add_cart_error" });
    }
  },
  removeFromCart: async (productId) => {
    try {
      await axios.delete("/cart", { data: { productId } });
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== productId),
      }));
      get().calculateTotals();
      toast.success("Product removed successfully", {
        id: "cart_remove_success",
      });
    } catch (error) {
      toast.error(error.response?.data?.error, { id: "cart_remove_error" });
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      if (quantity === 0) {
        get.removeFromCart(productId);
        return;
      }

      await axios.post(`/cart/${productId}`, { quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item,
        ),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response?.data?.error, { id: "quantity_update_error" });
    }
  },

  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    let total = subtotal;
    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }
    set({ subtotal, total });
  },
}));
