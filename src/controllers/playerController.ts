import { Request, Response } from 'express';
import { Database } from 'sqlite';
import { hashPassword, validatePassword, generateToken } from '../auth';
import {
  createPlayer,
  getPlayerByEmail,
  getPlayerById,
  getPlayers,
  updatePlayer,
  deletePlayer,
  getPlayersByTeamIds,
} from '../dataAccess/playerData';
import { getTeamsByPlayerId } from '../dataAccess/teamData';

const playerController = {
  async create(req: Request, res: Response, db: Database) {
    const { name, email, cellphone, password } = req.body;

    const hashedPassword = await hashPassword(password);

    try {
      const newPlayer = await createPlayer(
        db,
        name,
        email,
        cellphone,
        hashedPassword
      );

      res.status(201).send(newPlayer);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while creating the player.' });
    }
  },

  async login(req: Request, res: Response, db: Database) {
    const { email, password } = req.body;

    const user = await getPlayerByEmail(db, email);

    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }

    const isPasswordValid = await validatePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({ message: 'Invalid email or password.' });
    }

    const token = generateToken({ id: user.id, role: user.role });

    res.status(200).send({
      id: user.id,
      name: user.name,
      email: user.email,
      cellphone: user.cellphone,
      role: user.role,
      token,
    });
  },

  async readOne(req: Request, res: Response, db: Database) {
    const { id } = req.params;
    const userId = req.userId; // Get the authenticated user's ID from the request
    const userRole = req.userRole; // Get the authenticated user's role from the request

    try {
      if (userRole === 'admin') {
        const player = await getPlayerById(db, Number(id));

        if (!player) {
          return res.status(404).send({ message: 'Player not found.' });
        }

        res.status(200).send(player);
      } else {
        // If the user is not an admin, only retrieve their own player object and the players from their teams
        const player = await getPlayerById(db, Number(id));

        if (!player) {
          return res.status(404).send({ message: 'Player not found.' });
        }

        if (player.id === userId) {
          res.status(200).send(player);
        } else {
          const teams = await getTeamsByPlayerId(db, userId);
          const isTeamMember = teams.some(
            (team) => team.playerId === player.id
          );

          if (isTeamMember) {
            res.status(200).send(player);
          } else {
            res
              .status(403)
              .send({ message: 'Forbidden: Insufficient permissions' });
          }
        }
      }
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching the player.' });
    }
  },

  async readMany(req: Request, res: Response, db: Database) {
    const userId = req.userId;
    const userRole = req.userRole;

    try {
      let players;

      if (userRole === 'admin') {
        players = await getPlayers(db);
      } else if (userRole === 'player') {
        const teams = await getTeamsByPlayerId(db, userId);
        const teamIds = teams.map((team) => team.id);

        const playersFromTeams = await getPlayersByTeamIds(db, teamIds);
        players = [...playersFromTeams];
        if (playersFromTeams.length <= 0) {
          const ownPlayer = await getPlayerById(db, userId);
          players = [...players, ownPlayer];
        }
      }

      res.status(200).send(players);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching players.' });
    }
  },

  async update(req: Request, res: Response, db: Database) {
    const { id } = req.params;
    const { name, email, cellphone } = req.body;
    const userId = req.userId; // Get the user ID from the decoded token

    // Check if the user is trying to update their own information
    if (Number(id) !== userId) {
      return res.status(403).send({
        message: "You are not authorized to update this player's information.",
      });
    }

    try {
      const updatedPlayer = await updatePlayer(
        db,
        Number(id),
        name,
        email,
        cellphone
      );

      if (!updatedPlayer) {
        return res.status(404).send({ message: 'Player not found.' });
      }

      res.status(200).send(updatedPlayer);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while updating the player.' });
    }
  },

  async delete(req: Request, res: Response, db: Database) {
    const { id } = req.params;
    try {
      const deletedPlayer = await deletePlayer(db, Number(id));

      if (!deletedPlayer) {
        return res.status(404).send({ message: 'Player not found.' });
      }

      res.status(200).send(deletedPlayer);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while deleting the player.' });
    }
  },
};

export default playerController;
