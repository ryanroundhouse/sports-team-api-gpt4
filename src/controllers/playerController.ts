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
import {
  getTeamMembershipsByPlayerId,
  isUserCaptainOfTeam,
} from '../dataAccess/teamMembershipData';
import validator from 'validator'

const playerController = {
  async create(req: Request, res: Response, db: Database): Promise<Response> {
    const { name, email, cellphone, password } = req.body;

    // Validate input parameters
    if (!validator.isEmail(email)) {
      return res.status(400).send({ message: 'Invalid email format.' });
    }

    console.log(`invalid phone format: ${cellphone}`);
    if (!validator.isMobilePhone(cellphone)) {
      return res.status(400).send({ message: 'Invalid phone number format.' });
    }

    // Check if user already exists
    const existingUser = await getPlayerByEmail(db, email);
    if (existingUser) {
      return res.status(400).send({ message: 'Email already in use.' });
    }

    const hashedPassword = await hashPassword(password);

    try {
      const newPlayer = await createPlayer(
        db,
        name,
        email,
        cellphone,
        hashedPassword
      );

      return res.status(201).send(newPlayer);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while creating the player.' });
    }
  },

  async login(req: Request, res: Response, db: Database) {
    const { email, password } = req.body;

    // Validate input parameters
    if (!validator.isEmail(email)) {
      return res.status(400).send({ message: 'Invalid email format.' });
    }

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

  async readOne(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const userId = req.userId; // Get the authenticated user's ID from the request
    const userRole = req.userRole; // Get the authenticated user's role from the request

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      if (userRole === 'admin') {
        const player = await getPlayerById(db, Number(id));

        if (!player) {
          return res.status(404).send({ message: 'Player not found.' });
        }

        return res.status(200).send(player);
      } else {
        // If the user is not an admin, only retrieve their own player object and the players from their teams
        const player = await getPlayerById(db, Number(id));

        if (!player) {
          return res.status(404).send({ message: 'Player not found.' });
        }

        if (player.id === userId) {
          return res.status(200).send(player);
        } else {
          const teams = await getTeamsByPlayerId(db, userId);
          if (!teams) {
            throw "couldn't find team";
          }
          const isTeamMember = teams.some(async (team) => {
            return await isUserCaptainOfTeam(db, userId, team.id);
          });

          if (isTeamMember) {
            return res.status(200).send(player);
          } else {
            return res
              .status(403)
              .send({ message: 'Forbidden: Insufficient permissions' });
          }
        }
      }
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while fetching the player.' });
    }
  },

  async readMany(req: Request, res: Response, db: Database): Promise<Response> {
    const userId = req.userId;
    const userRole = req.userRole;

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: 'Unauthorized. Login before making this call.' });
      }
      let players;

      if (userRole === 'admin') {
        players = await getPlayers(db);
      } else if (userRole === 'player') {
        const teams = await getTeamsByPlayerId(db, userId);
        if (!teams) {
          throw "can't get teams by playerId";
        }
        const teamIds = teams.map((team) => team.id);

        const playersFromTeams = await getPlayersByTeamIds(db, teamIds);
        players = [...playersFromTeams];
        if (playersFromTeams.length <= 0) {
          const ownPlayer = await getPlayerById(db, userId);
          players = [...players, ownPlayer];
        }
      }

      return res.status(200).send(players);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while fetching players.' });
    }
  },

  async update(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const { name, email, cellphone } = req.body;
    const userId = req.userId; // Get the user ID from the decoded token

    // Validate input parameters
    if (!validator.isEmail(email)) {
      return res.status(400).send({ message: 'Invalid email format.' });
    }

    if (!validator.isMobilePhone(cellphone)) {
      return res.status(400).send({message: 'Invalid phone number format.'});
    }

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

      return res.status(200).send(updatedPlayer);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while updating the player.' });
    }
  },

  async delete(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const userId = req.userId;
  
    // Check if the user is trying to delete their own player
    if (Number(id) !== userId) {
      return res.status(403).send({
        message: 'You are not authorized to delete this player.',
      });
    }
  
    try {
      const deletedPlayer = await deletePlayer(db, Number(id));
  
      if (!deletedPlayer) {
        return res.status(404).send({ message: 'Player not found.' });
      }
  
      return res.status(200).send(deletedPlayer);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'An error occurred while deleting the player.' });
    }
  },
};

export default playerController;
