import { Request, Response } from 'express';
import { Database } from 'sqlite';
import * as gameData from '../dataAccess/gameData';
import {
  getTeamMembershipsByPlayerId,
  isUserCaptainOfTeam,
} from '../dataAccess/teamMembershipData';
import { Game } from '../models';
import { getGamesByTeamIds, updateGame } from '../dataAccess/gameData';

const gameController = {
  async create(req: Request, res: Response, db: Database): Promise<Response> {
    const userId = req.userId;
    const { location, opposingTeam, time, notes, teamId } = req.body;
    const newGame: Game = {
      id: 0, // This will be replaced by the auto-incrementing ID in the database.
      location,
      opposingTeam,
      time: new Date(time),
      notes,
      teamId,
    };

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const isCaptain = await isUserCaptainOfTeam(db, userId, teamId);

      if (!isCaptain) {
        return res
          .status(403)
          .send({ message: 'Only the team captain can create a game.' });
      }
      const game = await gameData.createGame(db, newGame);
      return res.status(201).send(game);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while creating the game.' });
    }
  },

  async readOne(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.userRole === 'admin';

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const game = await gameData.getGameById(db, Number(id));

      if (!game) {
        return res.status(404).send({ message: 'Game not found.' });
      }

      if (!isAdmin) {
        const memberships = await getTeamMembershipsByPlayerId(db, userId);
        const isTeamMember = memberships.some(
          (membership) => membership.teamId === game.teamId
        );

        if (!isTeamMember) {
          return res
            .status(403)
            .send({ message: 'You are not authorized to view this game.' });
        }
      }

      return res.status(200).send(game);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while fetching the game.' });
    }
  },

  async readMany(req: Request, res: Response, db: Database): Promise<Response> {
    try {
      const userId = req.userId; // Get the user ID from the decoded token
      const userRole = req.userRole; // Get the user role from the decoded token
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }

      let games;

      if (userRole === 'admin') {
        games = await gameData.getAllGames(db);
      } else {
        const teamMemberships = await getTeamMembershipsByPlayerId(db, userId);
        const teamIds = teamMemberships.map((membership) => membership.teamId);
        games = await getGamesByTeamIds(db, teamIds);
      }

      return res.status(200).send(games);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while fetching games.' });
    }
  },

  async update(req: Request, res: Response, db: Database): Promise<Response> {
    const userId = req.userId;
    const { id } = req.params;
    const { location, opposingTeam, time, notes, teamId } = req.body;
    const updatedGameData: Game = {
      id: parseInt(id),
      location,
      opposingTeam,
      time: new Date(time),
      notes,
      teamId,
    };
    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const isCaptain = await isUserCaptainOfTeam(db, userId, teamId);

      if (!isCaptain) {
        return res
          .status(403)
          .send({ message: 'Only the team captain can update a game.' });
      }
      const updatedGame = await updateGame(db, Number(id), updatedGameData);
      if (!updatedGame) {
        return res.status(404).send({ message: 'Game not found.' });
      }
      return res.status(200).send(updatedGame);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while updating the game.' });
    }
  },

  async delete(req: Request, res: Response, db: Database): Promise<Response> {
    const userId = req.userId;
    const { id } = req.params;
    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      const game = await gameData.getGameById(db, parseInt(id));
      if (!game) {
        return res.status(404).send({ message: 'Game not found.' });
      }
      const isCaptain = await isUserCaptainOfTeam(db, userId, game.teamId);
      if (!isCaptain) {
        return res
          .status(403)
          .send({ message: 'Only the team captain can delete a game.' });
      }
      const deletedGame = await gameData.deleteGame(db, Number(id));
      if (!deletedGame) {
        return res.status(404).send({ message: 'Game not found.' });
      }
      return res.status(200).send(deletedGame);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while deleting the game.' });
    }
  },
};

export default gameController;
