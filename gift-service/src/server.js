import { createApp } from './app.js';
import 'dotenv/config';

const port = process.env.PORT || 3000;

const start = async () => {
  const app = await createApp();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
};

start();
