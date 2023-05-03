import { Database } from 'sqlite';
import { hashPassword, validatePassword } from '../auth';
import { Player } from '../models';

export async function createPlayer(
  db: Database,
  name: string,
  email: string,
  cellphone: string,
  password: string
): Promise<Player | undefined> {
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

export async function getPlayerByEmail(
  db: Database,
  email: string
): Promise<Player | undefined> {
  const user = await db.get(
    'SELECT id, name, email, cellphone, password, role FROM players WHERE email = ?',
    email
  );

  return user;
}

export async function getPlayerById(
  db: Database,
  id: number
): Promise<Player | undefined> {
  const player = await db.get(
    'SELECT id, name, email, cellphone FROM players WHERE id = ?',
    id
  );

  return player;
}

export async function getPlayers(db: Database): Promise<Array<Player>> {
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
): Promise<Player | undefined> {
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

export async function promoteUserToAdmin(
  db: Database,
  id: number
): Promise<Player | undefined> {
  await db.run('UPDATE players SET role = ? WHERE id = ?', ['admin', id]);

  const promotedPlayer = await db.get(
    'SELECT id, name, email, cellphone, role FROM players WHERE id = ?',
    id
  );

  return promotedPlayer;
}

export async function getPlayersByTeamIds(
  db: Database,
  teamIds: number[]
): Promise<Array<Player>> {
  if (teamIds.length === 0) {
    return [];
  }

  const placeholders = teamIds.map(() => '?').join(',');
  const query = `SELECT DISTINCT p.* FROM players p
                 JOIN team_memberships tm ON p.id = tm.player_id
                 WHERE tm.team_id IN (${placeholders})`;

  return await db.all(query, teamIds);
}

export async function deletePlayer(
  db: Database,
  id: number
): Promise<Player | undefined> {
  const deletedPlayer = await db.get(
    'SELECT id, name, email, cellphone FROM players WHERE id = ?',
    id
  );

  await db.run('DELETE FROM players WHERE id = ?', id);

  return deletedPlayer;
}
