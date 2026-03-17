import mongoose from "mongoose";
import { ENV } from "./env.js";

const uri =
  ENV.NODE_ENV === "production" ? ENV.MONGO_URI : "mongodb://localhost:27017/";

export const connectDB = async () => {
  try {
    await mongoose.connect(uri);

    console.log(`MongoDB connected`);
  } catch (error) {
    console.error(`Error connecting MongoDB:`, error.message);
    throw error;
  }
};
