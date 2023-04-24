import supertest from 'supertest'
import express from 'express'
import initDatabase from '../db'
import setupGameRoutes from './gameRoutes'
import setupPlayerRoutes from './playerRoutes'
import setupTeamRoutes from './teamRoutes'
import { Database } from 'sqlite'
import { generateToken, hashPassword } from '../auth'
import { createPlayer, deletePlayer } from '../dataAccess/playerData'
import { createTeam } from '../dataAccess/teamData'
import { createTeamMembership } from '../dataAccess/teamMembershipData'
import { createGame } from '../dataAccess/gameData'
import { Game } from '../models'

const app = express()
app.use(express.json())

let db: Database

beforeAll(async () => {
  db = await initDatabase()
  app.use(setupPlayerRoutes(db))
  app.use(setupTeamRoutes(db))
  app.use(setupGameRoutes(db))
})

afterAll(async () => {
  await db.close()
})

describe('POST /games', () => {
  // Add the necessary data
  const captainData = {
    playerId: 1,
    name: 'Captain',
    email: 'captain@example.com',
    cellphone: '+1234567890',
    password: 'test123',
    role: 'player',
  }

  const teamData = {
    name: 'Test Team',
  }

  const gameData = {
    location: 'Test Location',
    opposingTeam: 'Test Opposing Team',
    time: '2023-05-01T18:00:00.000Z',
    notes: 'Test Notes',
    teamId: 1,
  }

  const missingGameData = {
    location: 'Test Location',
    time: '2023-05-01T18:00:00.000Z',
    notes: 'Test Notes',
    teamId: 2,
  }

  let captainId
  let nonCaptainId
  let teamId

  beforeEach(async () => {
    // Create captain player
    const captain = await createPlayer(
      db,
      'Captain',
      'captain@example.com',
      '+1234567890',
      await hashPassword('test123'),
    )
    captainId = captain.id

    // Create non-captain player
    const nonCaptain = await createPlayer(
      db,
      'Non-Captain',
      'non-captain@example.com',
      '+1234567891',
      await hashPassword('test123'),
    )
    nonCaptainId = nonCaptain.id

    // Create team
    teamId = await createTeam(db, 'Test Team')
    const captainMembershipId = await createTeamMembership(
      db,
      teamId,
      captainId,
      true,
    )
    const nonCaptainMembershipId = await createTeamMembership(
      db,
      teamId,
      nonCaptainId,
      false,
    )
  })

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM team_memberships')
    await db.run('DELETE FROM games')
  })

  it('should create a new game if the user is the team captain', async () => {
    const token = generateToken({ id: captainData.playerId, role: 'player' })

    const res = await supertest(app)
      .post('/games')
      .set('Authorization', `Bearer ${token}`)
      .send(gameData)

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.location).toEqual(gameData.location)
    expect(res.body.opposing_team).toEqual(gameData.opposingTeam)
    expect(res.body.notes).toEqual(gameData.notes)
    expect(res.body.team_id).toEqual(gameData.teamId)
  })

  it('should not create a new game if the user is not the team captain', async () => {
    // Prepare data for a non-captain user

    const token = generateToken({ id: nonCaptainId, role: 'player' })

    const res = await supertest(app)
      .post('/games')
      .set('Authorization', `Bearer ${token}`)
      .send(gameData)

    expect(res.status).toEqual(403)
    expect(res.body.message).toEqual('Only the team captain can create a game.')
  })
})

describe('GET /games', () => {
  const gameData1: Game = {
    id: 0, // This will be replaced by the auto-incrementing ID in the database.
    location: 'Test Location 1',
    opposingTeam: 'Test Opposing Team 1',
    time: new Date('2023-05-01T18:00:00.000Z'),
    notes: 'Test Notes 1',
    teamId: 1,
  }
  const gameData2: Game = {
    id: 0, // This will be replaced by the auto-incrementing ID in the database.
    location: 'Test Location 2',
    opposingTeam: 'Test Opposing Team 2',
    time: new Date('2023-05-02T18:00:00.000Z'),
    notes: 'Test Notes 2',
    teamId: 1,
  }
  let gameId1, gameId2

  beforeEach(async () => {
    // Create games
    const game1 = await createGame(db, gameData1)
    gameId1 = game1.id
    const game2 = await createGame(db, gameData2)
    gameId2 = game2.id
  })

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run('DELETE FROM games')
  })

  it('should return all games', async () => {
    const token = generateToken({ id: 1, role: 'player' })

    const res = await supertest(app)
      .get('/games')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.length).toEqual(2)
    expect(res.body[0].id).toEqual(gameId1)
    expect(res.body[1].id).toEqual(gameId2)
  })
})

describe('GET /games/:id', () => {
  const gameData1: Game = {
    id: 0, // This will be replaced by the auto-incrementing ID in the database.
    location: 'Test Location 1',
    opposingTeam: 'Test Opposing Team 1',
    time: new Date('2023-05-01T18:00:00.000Z'),
    notes: 'Test Notes 1',
    teamId: 1,
  }

  let gameId1

  beforeEach(async () => {
    // Create a game
    const game1 = await createGame(db, gameData1)
    gameId1 = game1.id
  })

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run('DELETE FROM games')
  })

  it('should return a game by its ID', async () => {
    const token = generateToken({ id: 1, role: 'player' })

    const res = await supertest(app)
      .get(`/games/${gameId1}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.id).toEqual(gameId1)
    expect(res.body.location).toEqual(gameData1.location)
    expect(res.body.opposing_team).toEqual(gameData1.opposingTeam)
    expect(res.body.notes).toEqual(gameData1.notes)
    expect(res.body.team_id).toEqual(gameData1.teamId)
  })

  it('should return a 404 error if the game is not found', async () => {
    const token = generateToken({ id: 1, role: 'player' })

    const res = await supertest(app)
      .get('/games/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(404)
    expect(res.body.message).toEqual('Game not found.')
  })
})
