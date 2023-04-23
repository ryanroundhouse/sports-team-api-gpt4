import express from 'express';
import teamController from '../controllers/teamController';
import { authenticate } from '../auth';
import { Database } from 'sqlite';

const router = express.Router();

const setupPlayerRoutes = (db: Database) => {
  router.post('/teams', authenticate, (req, res) =>
    teamController.create(req, res, db)
  );

  router.get('/teams', authenticate, (req, res) =>
    teamController.readMany(req, res, db)
  );

  router.get('/teams/:id', authenticate, (req, res) =>
    teamController.readOne(req, res, db)
  );

  router.put('/teams/:id', authenticate, (req, res) =>
    teamController.update(req, res, db)
  );

  router.delete('/teams/:id', authenticate, (req, res) =>
    teamController.delete(req, res, db)
  );

  return router;
};

export default setupPlayerRoutes;
