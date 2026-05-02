import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && process.env.NODE_ENV !== "test") {
  console.warn(
    "MONGODB_URI is not set. API routes will fail until you configure .env.local"
  );
}

const globalAny = typeof globalThis !== "undefined"
  ? globalThis
  : /** @type {typeof globalThis} */ ({});

if (!globalAny.__mongo) {
  globalAny.__mongo = { conn: null, promise: null };
}

/** Cached connection — avoids exhausting connections between hot reloads */
export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  const cache = globalAny.__mongo;
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
