import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'

const DATABASE_FILE = process.env.DATABASE_FILE || ':memory:'

const initDatabase = async (): Promise<Database> => {
  const db = await open({
    filename: DATABASE_FILE,
    driver: sqlite3.Database,
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      cellphone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      is_captain BOOLEAN NOT NULL,
      team_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams (id),
      FOREIGN KEY (player_id) REFERENCES players (id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      opposing_team TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      team_id INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams (id)
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      game_id INTEGER NOT NULL,
      FOREIGN KEY (player_id) REFERENCES players (id),
      FOREIGN KEY (game_id) REFERENCES games (id)
    );
  `)

  return db
}

export default initDatabase
