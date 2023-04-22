import express from 'express';
import initDatabase from './db';
import setupPlayerRoutes from './routes/playerRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

(async () => {
  const db = await initDatabase();

  app.use('/api', setupPlayerRoutes(db));

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();

export default app;
