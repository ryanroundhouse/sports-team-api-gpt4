import express from 'express';
import { Database } from 'sqlite';
import { authenticate } from '../auth';
import teamMembershipController from '../controllers/teamMembershipController';

const router = express.Router();

const setupTeamMembershipRoutes = (db: Database) => {
  router.post('/teams/:teamId/team-memberships', authenticate, (req, res) =>
    teamMembershipController.create(req, res, db)
  );

  router.get('/teams/:teamId/team-memberships', authenticate, (req, res) =>
    teamMembershipController.readMany(req, res, db)
  );

  router.get('/teams/:teamId/team-memberships/:id', authenticate, (req, res) =>
    teamMembershipController.readOne(req, res, db)
  );

  router.put('/teams/:teamId/team-memberships/:id', authenticate, (req, res) =>
    teamMembershipController.update(req, res, db)
  );

  router.delete(
    '/teams/:teamId/team-memberships/:id',
    authenticate,
    (req, res) => teamMembershipController.delete(req, res, db)
  );

  return router;
};

export default setupTeamMembershipRoutes;
