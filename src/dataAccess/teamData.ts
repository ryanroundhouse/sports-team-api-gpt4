import { Database } from 'sqlite';

export async function createTeam(db: Database, name: string) {
  const result = await db.run('INSERT INTO teams (name) VALUES (?)', [name]);
  return result.lastID;
}

export async function getTeams(db: Database) {
  return await db.all('SELECT id, name FROM teams');
}

// Add this function to your teamData.ts file
export async function getTeamsByPlayerId(db: Database, playerId: number) {
  return await db.all(
    `SELECT t.* FROM teams t
     JOIN team_memberships tm ON t.id = tm.team_id
     WHERE tm.player_id = ?`,
    [playerId]
  );
}

export async function getTeamById(db: Database, id: number) {
  return await db.get('SELECT id, name FROM teams WHERE id = ?', id);
}

export async function updateTeam(db: Database, id: number, name: string) {
  await db.run('UPDATE teams SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteTeam(db: Database, id: number) {
  await db.run('DELETE FROM teams WHERE id = ?', id);
}
