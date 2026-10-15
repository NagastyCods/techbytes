const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

/**
 * mongodb+srv:// needs an SRV lookup before any socket opens.
 * On Vercel that lookup is often refused by the default resolver, and the
 * request fails in well under a second — the same 500 on every route.
 */
function prepareSrvDns(uri) {
  if (!process.env.VERCEL || !String(uri).startsWith('mongodb+srv:')) return;
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

/**
 * One pool per warm instance. Vercel Fluid reuses the process, so a second
 * request must not open another connection.
 */
const cache = globalThis.__techbytesMongo || (globalThis.__techbytesMongo = { promise: null });

async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    prepareSrvDns(env.mongoUri);
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
