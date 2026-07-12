import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => console.log("Database connected"));

    const uri = process.env.NODE_ENV === 'test' && process.env.TEST_MONGODB_URI
      ? process.env.TEST_MONGODB_URI
      : process.env.MONGODB_URI;

    await mongoose.connect(`${uri}/mern_auth`);
    console.log("Mongo URI:", uri);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.warn("⚠️  Server running without database connection. Some features may not work.");
  }
};

export default connectDB;
