import { Request, Response } from 'express';
import { Database } from 'sqlite';
import {
  createTeamMembership,
  getTeamMembershipByTeamAndPlayer,
  getCaptainMembershipByTeamAndPlayer,
  getTeamMembershipsByTeam,
  getTeamMembershipByIdAndTeam,
  updateTeamMembership,
  deleteTeamMembership,
  isUserCaptainOfTeam,
} from '../dataAccess/teamMembershipData';

const teamMembershipController = {
  async create(req: Request, res: Response, db: Database) {
    const { playerId, isCaptain } = req.body;
    const { teamId } = req.params;
    const userId = req.userId;

    try {
      if (playerId !== userId) {
        const captainMembership = await getCaptainMembershipByTeamAndPlayer(
          db,
          parseInt(teamId),
          userId
        );

        if (!captainMembership) {
          return res.status(403).send({
            message:
              'Only the player themselves or a team captain can add a team membership.',
          });
        }
      }

      const existingMembership = await getTeamMembershipByTeamAndPlayer(
        db,
        parseInt(teamId),
        playerId
      );

      if (existingMembership) {
        return res.status(409).send({
          message:
            'A team membership with the same playerId and teamId already exists.',
        });
      }

      const newMembership = await createTeamMembership(
        db,
        parseInt(teamId),
        playerId,
        isCaptain
      );

      res.status(201).send(newMembership);
    } catch (error) {
      res.status(500).send({
        message: 'An error occurred while creating the team membership.',
      });
    }
  },

  async readMany(req: Request, res: Response, db: Database) {
    const { teamId } = req.params;

    try {
      const memberships = await getTeamMembershipsByTeam(db, parseInt(teamId));
      res.status(200).send(memberships);
    } catch (error) {
      res.status(500).send({
        message: 'An error occurred while fetching team memberships.',
      });
    }
  },

  async readOne(req: Request, res: Response, db: Database) {
    const { id, teamId } = req.params;

    try {
      const membership = await getTeamMembershipByIdAndTeam(
        db,
        parseInt(id),
        parseInt(teamId)
      );

      if (!membership) {
        return res.status(404).send({ message: 'Team membership not found.' });
      }

      res.status(200).send(membership);
    } catch (error) {
      res.status(500).send({
        message: 'An error occurred while fetching the team membership.',
      });
    }
  },

  async update(req: Request, res: Response, db: Database) {
    const { id, teamId } = req.params;
    const { playerId, isCaptain } = req.body;
    const userId = req.userId;

    try {
      const isCaptainOfTeam = await isUserCaptainOfTeam(
        db,
        userId,
        parseInt(teamId)
      );

      if (!isCaptainOfTeam) {
        return res.status(403).send({
          message: 'Only the team captain can update team memberships.',
        });
      }

      const updatedMembership = await updateTeamMembership(
        db,
        parseInt(id),
        parseInt(teamId),
        playerId,
        isCaptain
      );

      if (!updatedMembership) {
        return res.status(404).send({ message: 'Team membership not found.' });
      }

      res.status(200).send(updatedMembership);
    } catch (error) {
      res.status(500).send({
        message: 'An error occurred while updating the team membership.',
      });
    }
  },

  async delete(req: Request, res: Response, db: Database) {
    const { id, teamId } = req.params;
    const userId = req.userId;

    try {
      const deletedMembership = await getTeamMembershipByIdAndTeam(
        db,
        parseInt(id),
        parseInt(teamId)
      );

      if (!deletedMembership) {
        return res.status(404).send({ message: 'Team membership not found.' });
      }

      const isCaptainOfTeam = await isUserCaptainOfTeam(
        db,
        userId,
        parseInt(teamId)
      );
      const isPlayer = userId === deletedMembership.playerId;

      if (!isCaptainOfTeam && !isPlayer) {
        return res.status(403).send({
          message:
            'Only the team captain or the player themselves can delete the team membership.',
        });
      }

      await deleteTeamMembership(db, parseInt(id), parseInt(teamId));

      res.status(200).send(deletedMembership);
    } catch (error) {
      res.status(500).send({
        message: 'An error occurred while deleting the team membership.',
      });
    }
  },
};

export default teamMembershipController;
