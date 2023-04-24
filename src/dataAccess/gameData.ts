import { Database } from 'sqlite'
import { Game } from '../models'

export async function createGame(db: Database, game: Game) {
  const result = await db.run(
    'INSERT INTO games (location, opposing_team, time, notes, team_id) VALUES (?, ?, ?, ?, ?)',
    [game.location, game.opposingTeam, game.time, game.notes, game.teamId],
  )

  const newGameId = result.lastID

  return getGameById(db, newGameId)
}

export async function getGameById(db: Database, id: number) {
  return await db.get('SELECT * FROM games WHERE id = ?', id)
}

export async function getAllGames(db: Database) {
  return await db.all('SELECT * FROM games')
}

export async function updateGame(db: Database, id: number, game: Game) {
  await db.run(
    'UPDATE games SET location = ?, opposing_team = ?, time = ?, notes = ?, team_id = ? WHERE id = ?',
    [game.location, game.opposingTeam, game.time, game.notes, game.teamId, id],
  )

  return getGameById(db, id)
}

export async function deleteGame(db: Database, id: number) {
  const deletedGame = await getGameById(db, id)

  if (deletedGame) {
    await db.run('DELETE FROM games WHERE id = ?', id)
  }

  return deletedGame
}
