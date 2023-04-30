import { Database } from 'sqlite';
import { hashPassword, validatePassword } from '../auth';

export async function createPlayer(
  db: Database,
  name: string,
  email: string,
  cellphone: string,
  password: string
) {
  const hashedPassword = await hashPassword(password);
  const result = await db.run(
    'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, cellphone, hashedPassword, 'player']
  );

  const newPlayerId = result.lastID;
  const newPlayer = await db.get(
    'SELECT id, name, email, cellphone FROM players WHERE id = ?',
    newPlayerId
  );

  return newPlayer;
}

export async function getPlayerByEmail(db: Database, email: string) {
  const user = await db.get(
    'SELECT id, name, email, cellphone, password, role FROM players WHERE email = ?',
    email
  );

  return user;
}

export async function getPlayerById(db: Database, id: number) {
  const player = await db.get(
    'SELECT id, name, email, cellphone FROM players WHERE id = ?',
    id
  );

  return player;
}

export async function getPlayers(db: Database) {
  const players = await db.all(
    'SELECT id, name, email, cellphone FROM players'
  );

  return players;
}

export async function updatePlayer(
  db: Database,
  id: number,
  name: string,
  email: string,
  cellphone: string
) {
  await db.run(
    'UPDATE players SET name = ?, email = ?, cellphone = ? WHERE id = ?',
    [name, email, cellphone, id]
  );

  const updatedPlayer = await db.get(
    'SELECT id, name, email, cellphone FROM players WHERE id = ?',
    id
  );

  return updatedPlayer;
}

export async function promoteUserToAdmin(db: Database, id: number) {
  await db.run('UPDATE players SET role = ? WHERE id = ?', ['admin', id]);

  const promotedPlayer = await db.get(
    'SELECT id, name, email, cellphone, role FROM players WHERE id = ?',
    id
  );

  return promotedPlayer;
}

export async function deletePlayer(db: Database, id: number) {
  const deletedPlayer = await db.get(
    'SELECT id, name, email, cellphone FROM players WHERE id = ?',
    id
  );

  await db.run('DELETE FROM players WHERE id = ?', id);

  return deletedPlayer;
}
