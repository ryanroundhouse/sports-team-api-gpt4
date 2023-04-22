import { Request, Response } from 'express';
import { Database } from 'sqlite';
import { hashPassword, validatePassword, generateToken } from '../auth';

const playerController = {
  async create(req: Request, res: Response, db: Database) {
    const { name, email, cellphone, password } = req.body;

    const hashedPassword = await hashPassword(password);

    try {
      const result = await db.run(
        'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, cellphone, hashedPassword, 'player']
      );

      const newPlayerId = result.lastID;

      const newPlayer = await db.get(
        'SELECT id, name, email, cellphone FROM players WHERE id = ?',
        newPlayerId
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

    const user = await db.get(
      'SELECT id, name, email, cellphone, password, role FROM players WHERE email = ?',
      email
    );

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

    try {
      const player = await db.get(
        'SELECT id, name, email, cellphone FROM players WHERE id = ?',
        id
      );

      if (!player) {
        return res.status(404).send({ message: 'Player not found.' });
      }

      res.status(200).send(player);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching the player.' });
    }
  },

  async readMany(req: Request, res: Response, db: Database) {
    try {
      const players = await db.all(
        'SELECT id, name, email, cellphone FROM players'
      );

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

    try {
      await db.run(
        'UPDATE players SET name = ?, email = ?, cellphone = ? WHERE id = ?',
        [name, email, cellphone, id]
      );

      const updatedPlayer = await db.get(
        'SELECT id, name, email, cellphone FROM players WHERE id = ?',
        id
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
      const deletedPlayer = await db.get(
        'SELECT id, name, email, cellphone FROM players WHERE id = ?',
        id
      );

      if (!deletedPlayer) {
        return res.status(404).send({ message: 'Player not found.' });
      }

      await db.run('DELETE FROM players WHERE id = ?', id);

      res.status(200).send(deletedPlayer);
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while deleting the player.' });
    }
  },
};

export default playerController;
