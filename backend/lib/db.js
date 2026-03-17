import mongoose from "mongoose";
import { ENV } from "./env.js";

const uri =
  ENV.NODE_ENV === "production" ? ENV.MONGO_URI : "mongodb://localhost:27017/";

export const connectDB = async () => {
  await mongoose
    .connect(uri)
    .then(() => {
      console.log(`MongoDB connected`);
    })
    .catch(() => {
      console.log(`Error connecting mongoDB`);
    });
};
