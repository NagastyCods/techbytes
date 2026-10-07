const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connect to MongoDB. Mongoose 8+ uses a single connection string;
 * extra options like useNewUrlParser are no longer needed.
 */
async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = { connectDb };
