import express from 'express';
import playerController from '../controllers/playerController';
import { authenticate } from '../auth';
import { Database } from 'sqlite';

const router = express.Router();

const setupPlayerRoutes = (db: Database) => {
  router.post('/players', (req, res) => playerController.create(req, res, db));

  router.post('/players/login', (req, res) =>
    playerController.login(req, res, db)
  );

  router.get('/players', authenticate, (req, res) =>
    playerController.readMany(req, res, db)
  );

  router.get('/players/:id', authenticate, (req, res) =>
    playerController.readOne(req, res, db)
  );

  router.put('/players/:id', authenticate, (req, res) =>
    playerController.update(req, res, db)
  );

  router.delete('/players/:id', authenticate, (req, res) =>
    playerController.delete(req, res, db)
  );

  return router;
};

export default setupPlayerRoutes;
