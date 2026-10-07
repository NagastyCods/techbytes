const env = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`${env.siteName} running at ${env.siteUrl} (port ${env.port})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
