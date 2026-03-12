import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect("mongodb://localhost:27017/" || process.env.MONGO_URL)
    .then(() => {
      console.log(`MongoDB connected`);
    })
    .catch(() => {
      console.log(`Error connecting mongoDB`);
    });
};
