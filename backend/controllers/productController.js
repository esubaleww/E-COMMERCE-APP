import redis from "../lib/redis.js";
import Product from "../models/Product.js";
import cloudinary from "../lib/coudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducs controller: ", error);
    res.status(500).json({ message: "Server error: ", error });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featureProducts = await redis.get("featured_products");
    if (featureProducts) {
      return res.json(JSON.parse(featureProducts));
    }
    featureProducts = await Product.find({ isFeatured: true }).lean();

    if (!featureProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }
    await redis.set("featured_products", JSON.stringify(featureProducts));

    res.json(featureProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducs controller:", error.message);
    res.status(500).json({ message: "Server error:", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image: cloudinaryResponse?.secure_url || "",
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error in createProduct controller:", error.message);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "No product found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (error) {
        console.log("Error deleting image from cloudinary:", error);
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "A product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error:", error: error.message });
  }
};

export const getRecomendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    res.json(products);
  } catch (error) {
    console.log("Error in getRecomendedProducts controller:", error.message);
    res.status(500).json({ message: "Server error:", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller:", error.message);
    res.status(500).json({ message: "Server error:", error: error.message });
  }
};

export const toggleFeaturedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProducts controller:", error.message);
    res.status(500).json({ message: "Server error:", error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const featureProducts = await Product.find({ isFeatured: true }).lean();

    await redis.set("featured_products", JSON.stringify(featureProducts));
  } catch (error) {
    console.log(
      "Error in updateFeaturedProductsCache function:",
      error.message,
    );
    res.status(500).json({ message: "Server error:", error: error.message });
  }
}
