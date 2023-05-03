import { Request, Response } from 'express';
import { Database } from 'sqlite';
import {
  createTeamMembership,
  deleteTeamMembershipsByTeam,
  isUserCaptainOfTeam,
} from '../dataAccess/teamMembershipData';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} from '../dataAccess/teamData';

const teamController = {
  async create(req: Request, res: Response, db: Database): Promise<Response> {
    const { name } = req.body;
    const userId = req.userId;

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const newTeamId = await createTeam(db, name);
      if (!newTeamId) {
        throw 'unable to create team.';
      }

      const newTeam = await getTeamById(db, newTeamId);

      const newMembership = await createTeamMembership(
        db,
        newTeamId,
        userId,
        true
      );

      return res.status(201).send(newTeam);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while creating the team.' });
    }
  },

  async readMany(req: Request, res: Response, db: Database): Promise<Response> {
    try {
      const teams = await getTeams(db);
      return res.status(200).send(teams);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while fetching teams.' });
    }
  },

  async readOne(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;

    try {
      const team = await getTeamById(db, Number(id));

      if (!team) {
        return res.status(404).send({ message: 'Team not found.' });
      }

      return res.status(200).send(team);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while fetching the team.' });
    }
  },

  async update(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const isCaptain = await isUserCaptainOfTeam(db, userId, Number(id));

      if (!isCaptain) {
        return res
          .status(403)
          .send({ message: 'Only the team captain can update the team.' });
      }

      await updateTeam(db, Number(id), name);

      const updatedTeam = await getTeamById(db, Number(id));

      if (!updatedTeam) {
        return res.status(404).send({ message: 'Team not found.' });
      }

      return res.status(200).send(updatedTeam);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while updating the team.' });
    }
  },

  async delete(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const userId = req.userId;

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const deletedTeam = await getTeamById(db, Number(id));

      if (!deletedTeam) {
        return res.status(404).send({ message: 'Team not found.' });
      }

      const isCaptainOfTeam = await isUserCaptainOfTeam(
        db,
        userId,
        deletedTeam.id
      );

      if (!isCaptainOfTeam) {
        return res.status(403).send({
          message: 'Only the team captain can delete the team.',
        });
      }

      // Delete team memberships associated with the team
      await deleteTeamMembershipsByTeam(db, parseInt(id));

      // Delete the team
      await deleteTeam(db, parseInt(id));

      return res.status(200).send(deletedTeam);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while deleting the team.' });
    }
  },
};

export default teamController;
