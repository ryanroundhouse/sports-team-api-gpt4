import { Database } from 'sqlite';
import { Team } from '../models';

export async function createTeam(
  db: Database,
  name: string
): Promise<number | undefined> {
  const result = await db.run('INSERT INTO teams (name) VALUES (?)', [name]);
  return result.lastID;
}

export async function getTeams(db: Database): Promise<Array<Team> | undefined> {
  return await db.all('SELECT id, name FROM teams');
}

// Add this function to your teamData.ts file
export async function getTeamsByPlayerId(
  db: Database,
  playerId: number
): Promise<Array<Team> | undefined> {
  return await db.all(
    `SELECT t.id, t.name FROM teams t
     JOIN team_memberships tm ON t.id = tm.team_id
     WHERE tm.player_id = ?`,
    [playerId]
  );
}

export async function getTeamById(
  db: Database,
  id: number
): Promise<Team | undefined> {
  return await db.get('SELECT id, name FROM teams WHERE id = ?', id);
}

export async function updateTeam(
  db: Database,
  id: number,
  name: string
): Promise<Team | undefined> {
  await db.run('UPDATE teams SET name = ? WHERE id = ?', [name, id]);
  const team = await getTeamById(db, id);
  return team;
}

export async function deleteTeam(
  db: Database,
  id: number
): Promise<Team | undefined> {
  const teamToDelete = await getTeamById(db, id);
  await db.run('DELETE FROM teams WHERE id = ?', id);
  return teamToDelete;
}
