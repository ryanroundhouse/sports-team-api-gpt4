import { Request, Response } from 'express';
import { Database } from 'sqlite';
import {
  createTeamMembership,
  deleteTeamMembershipsByTeam,
  isUserCaptainOfTeam,
} from '../dataAccess/teamMembershipData';

const teamController = {
  async create(req: Request, res: Response, db: Database) {
    const { name } = req.body;
    const userId = req.userId;

    try {
      const result = await db.run(
        'INSERT INTO teams (name, captainId) VALUES (?, ?)',
        [name, userId]
      );

      const newTeamId = result.lastID;

      const newTeam = await db.get(
        'SELECT id, name, captainId FROM teams WHERE id = ?',
        newTeamId
      );

      const newMembership = await createTeamMembership(
        db,
        newTeamId,
        userId,
        true
      );

      res.status(201).send(newTeam);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while creating the team.' });
    }
  },

  async readMany(req: Request, res: Response, db: Database) {
    try {
      const teams = await db.all('SELECT id, name FROM teams');
      res.status(200).send(teams);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching teams.' });
    }
  },

  async readOne(req: Request, res: Response, db: Database) {
    const { id } = req.params;

    try {
      const team = await db.get('SELECT id, name FROM teams WHERE id = ?', id);

      if (!team) {
        return res.status(404).send({ message: 'Team not found.' });
      }

      res.status(200).send(team);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching the team.' });
    }
  },

  async update(req: Request, res: Response, db: Database) {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    try {
      const isCaptain = await isUserCaptainOfTeam(db, userId, Number(id));

      if (!isCaptain) {
        return res
          .status(403)
          .send({ message: 'Only the team captain can update the team.' });
      }

      await db.run('UPDATE teams SET name = ? WHERE id = ?', [name, id]);

      const updatedTeam = await db.get(
        'SELECT id, name FROM teams WHERE id = ?',
        id
      );

      if (!updatedTeam) {
        return res.status(404).send({ message: 'Team not found.' });
      }

      res.status(200).send(updatedTeam);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while updating the team.' });
    }
  },

  async delete(req: Request, res: Response, db: Database) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const deletedTeam = await db.get(
        'SELECT id, name FROM teams WHERE id = ?',
        id
      );

      if (!deletedTeam) {
        return res.status(404).send({ message: 'Team not found.' });
      }

      const isCaptainOfTeam = await isUserCaptainOfTeam(
        db,
        userId,
        parseInt(deletedTeam)
      );

      if (!isCaptainOfTeam) {
        return res.status(403).send({
          message: 'Only the team captain can delete the team.',
        });
      }

      // Delete team memberships associated with the team
      await deleteTeamMembershipsByTeam(db, parseInt(id));

      // Delete the team
      await db.run('DELETE FROM teams WHERE id = ?', id);

      res.status(200).send(deletedTeam);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while deleting the team.' });
    }
  },
};

export default teamController;
