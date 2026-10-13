const mongoose = require('mongoose');
const env = require('./env');

/**
 * One pool per warm instance. Vercel Fluid reuses the process, so a second
 * request must not open another connection.
 */
const cache = globalThis.__techbytesMongo || (globalThis.__techbytesMongo = { promise: null });

async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB connected: ${mongooseInstance.connection.name}`);
        return mongooseInstance.connection;
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  return cache.promise;
}

module.exports = { connectDb };
