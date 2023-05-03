import { Database } from 'sqlite';
import { Game } from '../models';

export async function createGame(
  db: Database,
  game: Game
): Promise<Game | undefined> {
  const result = await db.run(
    'INSERT INTO games (location, opposing_team, time, notes, team_id) VALUES (?, ?, ?, ?, ?)',
    [game.location, game.opposingTeam, game.time, game.notes, game.teamId]
  );

  const newGameId = result.lastID;
  if (!newGameId) {
    return undefined;
  }

  return getGameById(db, newGameId);
}

export async function getGameById(
  db: Database,
  id: number
): Promise<Game | undefined> {
  return await db.get(
    'SELECT id, location, opposing_team AS opposingTeam, time, notes, team_id AS teamId FROM games WHERE id = ?',
    id
  );
}

export async function getAllGames(db: Database): Promise<Array<Game>> {
  return await db.all(
    'SELECT id, location, opposing_team AS opposingTeam, time, notes, team_id AS teamId FROM games'
  );
}

export async function updateGame(
  db: Database,
  id: number,
  game: Game
): Promise<Game | undefined> {
  await db.run(
    'UPDATE games SET location = ?, opposing_team = ?, time = ?, notes = ?, team_id = ? WHERE id = ?',
    [game.location, game.opposingTeam, game.time, game.notes, game.teamId, id]
  );

  return getGameById(db, id);
}

export async function getGamesByTeamIds(
  db: Database,
  teamIds: number[]
): Promise<Game[]> {
  if (teamIds.length === 0) {
    return [];
  }

  const placeholders = teamIds.map(() => '?').join(',');
  const sql = `
    SELECT
      id,
      location,
      opposing_team AS opposingTeam,
      time,
      notes,
      team_id AS teamId
    FROM games
    WHERE team_id IN (${placeholders})
  `;

  return await db.all(sql, teamIds);
}

export async function deleteGame(
  db: Database,
  id: number
): Promise<Game | undefined> {
  const deletedGame = await getGameById(db, id);

  if (deletedGame) {
    await db.run('DELETE FROM games WHERE id = ?', id);
  }

  return deletedGame;
}
