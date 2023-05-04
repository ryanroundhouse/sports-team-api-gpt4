import express from 'express';
import playerController from '../controllers/playerController';
import { authenticate } from '../auth';
import { Database } from 'sqlite';
import logger from '../logger';

const router = express.Router();

const setupPlayerRoutes = (db: Database) => {
  router.post('/players', (req, res) => {
    logger.info('POST /players');
    playerController.create(req, res, db);
  });

  router.post('/players/login', (req, res) => {
    logger.info('POST /players/login');
    playerController.login(req, res, db);
  });

  router.get('/players', authenticate, (req, res) => {
    logger.info('GET /players');
    playerController.readMany(req, res, db);
  });

  router.get('/players/:id', authenticate, (req, res) => {
    logger.info(`GET /players/${req.params.id}`);
    playerController.readOne(req, res, db);
  });

  router.put('/players/:id', authenticate, (req, res) => {
    logger.info(`PUT /players/${req.params.id}`);
    playerController.update(req, res, db);
  });

  router.delete('/players/:id', authenticate, (req, res) => {
    logger.info(`DELETE /players/${req.params.id}`);
    playerController.delete(req, res, db);
  });

  return router;
};

export default setupPlayerRoutes;
