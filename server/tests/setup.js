import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongoServer = await MongoMemoryServer.create();
const uri = mongoServer.getUri();

process.env.TEST_MONGODB_URI = uri.replace(/\/$/, "");
process.env.NODE_ENV = "test";

afterAll(async () => {
  await mongoose.disconnect().catch(() => {});
  await mongoServer.stop();
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;

  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) =>
      c.deleteMany({}),
    ),
  );
});
