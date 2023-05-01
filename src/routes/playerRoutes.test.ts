import supertest from 'supertest'
import express from 'express'
import initDatabase from '../db'
import setupPlayerRoutes from './playerRoutes'
import { Database } from 'sqlite'
import { generateToken, hashPassword } from '../auth'
import { createPlayer, promoteUserToAdmin } from '../dataAccess/playerData'
import { createTeam } from '../dataAccess/teamData'
import { createTeamMembership } from '../dataAccess/teamMembershipData'

const app = express()
app.use(express.json())

let db: Database

beforeAll(async () => {
  db = await initDatabase()
  app.use(setupPlayerRoutes(db))
})

afterAll(async () => {
  await db.close()
})

describe('Player routes', () => {
  const playerData = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    cellphone: '+1234567890',
    password: 'test123',
  }

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run('DELETE FROM players')
  })

  it('should create a new player', async () => {
    const res = await supertest(app).post('/players').send(playerData)

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toEqual(playerData.name)
    expect(res.body.email).toEqual(playerData.email)
    expect(res.body.cellphone).toEqual(playerData.cellphone)
  })

  it('should login with the correct credentials', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password)
    const {
      lastID,
    } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ],
    )

    const res = await supertest(app)
      .post('/players/login')
      .send({ email: playerData.email, password: playerData.password })

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('token')
  })

  it('should fail login with incorrect credentials', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password)
    const {
      lastID,
    } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ],
    )

    const res = await supertest(app)
      .post('/players/login')
      .send({ email: playerData.email, password: 'wrongpassword' })

    expect(res.status).toEqual(401)
  })

  it('should read one player', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password)
    const {
      lastID,
    } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ],
    )
    const token = generateToken({ id: lastID, role: 'player' })

    const res = await supertest(app)
      .get(`/players/${lastID}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toEqual(playerData.name)
    expect(res.body.email).toEqual(playerData.email)
    expect(res.body.cellphone).toEqual(playerData.cellphone)
  })

  it('should read many players', async () => {
    // Create test players for this test
    const hashedPassword = await hashPassword(playerData.password)
    await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ],
    )
    const {
      lastID,
    } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        'Jane Doe',
        'janedoe@example.com',
        '+1234567891',
        hashedPassword,
        'admin',
      ],
    )
    const token = generateToken({ id: lastID, role: 'admin' })

    const res = await supertest(app)
      .get('/players')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveLength(2)
  })

  it('should update a player', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password)
    const {
      lastID,
    } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ],
    )

    const updatedPlayerData = {
      name: 'John Updated',
      email: 'johnupdated@example.com',
      cellphone: '+1234567899',
    }
    const token = generateToken({ id: lastID, role: 'player' })

    const res = await supertest(app)
      .put(`/players/${lastID}`)
      .send(updatedPlayerData)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toEqual(updatedPlayerData.name)
    expect(res.body.email).toEqual(updatedPlayerData.email)
    expect(res.body.cellphone).toEqual(updatedPlayerData.cellphone)
  })

  it("should not allow a player to update another player's information", async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password)
    const playerToUpdate = (
      await db.run(
        'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
        [
          playerData.name,
          playerData.email,
          playerData.cellphone,
          hashedPassword,
          'player',
        ],
      )
    ).lastID

    const unAuthorizedPlayerId = (
      await db.run(
        'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
        [
          playerData.name,
          'new email',
          playerData.cellphone,
          hashedPassword,
          'player',
        ],
      )
    ).lastID

    const token = generateToken({ id: unAuthorizedPlayerId, role: 'player' })

    const updatedInfo = {
      name: 'Updated Player Two',
      email: 'updatedplayertwo@example.com',
      cellphone: '+1111111111',
    }

    const res = await supertest(app)
      .put(`/players/${playerToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedInfo)

    expect(res.status).toEqual(403)
    expect(res.body.message).toEqual(
      "You are not authorized to update this player's information.",
    )
  })

  it('should delete a player', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password)
    const {
      lastID,
    } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ],
    )
    const token = generateToken({ id: lastID, role: 'player' })

    const res = await supertest(app)
      .delete(`/players/${lastID}`)
      .set('Authorization', `Bearer ${token}`)

    const deletedPlayer = await db.get(
      'SELECT id, name, email, cellphone FROM players WHERE id = ?',
      lastID,
    )

    expect(deletedPlayer).toBe(undefined)
    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toEqual(playerData.name)
    expect(res.body.email).toEqual(playerData.email)
    expect(res.body.cellphone).toEqual(playerData.cellphone)
  })
})

describe('GET /players/:id', () => {
  let adminId
  let playerId
  let otherPlayerId

  beforeEach(async () => {
    // Create players
    adminId = (
      await createPlayer(
        db,
        'Admin',
        'admin@example.com',
        '+1234567890',
        await hashPassword('test123'),
      )
    ).id
    await promoteUserToAdmin(db, adminId)
    playerId = (
      await createPlayer(
        db,
        'Player',
        'player@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
    otherPlayerId = (
      await createPlayer(
        db,
        'Other Player',
        'otherplayer@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
  })

  afterEach(async () => {
    await db.run('DELETE FROM players')
  })

  it('should return a player if the user is an admin', async () => {
    const token = generateToken({ id: adminId, role: 'admin' })

    const res = await supertest(app)
      .get(`/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.id).toEqual(playerId)
  })

  it('should return a player if the user is the requested player', async () => {
    const token = generateToken({ id: playerId, role: 'player' })

    const res = await supertest(app)
      .get(`/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.id).toEqual(playerId)
  })

  it('should not return a player if the user is not an admin and not the requested player', async () => {
    const token = generateToken({ id: otherPlayerId, role: 'player' })

    const res = await supertest(app)
      .get(`/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(403)
    expect(res.body.message).toEqual('Forbidden: Insufficient permissions')
  })

  it('should return 404 if the player does not exist', async () => {
    const token = generateToken({ id: adminId, role: 'admin' })

    const nonExistentPlayerId = 999
    const res = await supertest(app)
      .get(`/players/${nonExistentPlayerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(404)
    expect(res.body.message).toEqual('Player not found.')
  })

  it('should not return a player if the user is not authenticated', async () => {
    const res = await supertest(app).get(`/players/${playerId}`)

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })
})

describe('GET /players', () => {
  let adminId
  let playerWithoutTeam
  let playerId
  let teamId

  beforeEach(async () => {
    adminId = (
      await createPlayer(
        db,
        'Admin',
        'admin@example.com',
        '+1111111111',
        await hashPassword('admin123'),
      )
    ).id
    await promoteUserToAdmin(db, adminId)

    playerId = (
      await createPlayer(
        db,
        'Player',
        'player@example.com',
        '+2222222222',
        await hashPassword('player123'),
      )
    ).id

    playerWithoutTeam = (
      await createPlayer(
        db,
        'Player',
        'noteam@example.com',
        '+2222222222',
        await hashPassword('player123'),
      )
    ).id

    teamId = await createTeam(db, 'Test Team')
    await createTeamMembership(db, teamId, playerId, false)
  })

  afterEach(async () => {
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM team_memberships')
  })

  it('should return all players for an admin', async () => {
    const token = generateToken({ id: adminId, role: 'admin' })

    const res = await supertest(app)
      .get('/players')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.length).toEqual(3)
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: adminId }),
        expect.objectContaining({ id: playerId }),
      ]),
    )
  })

  it('should return players from teams a player is a member of and their own player object for a non-admin player', async () => {
    const token = generateToken({ id: playerId, role: 'player' })

    const res = await supertest(app)
      .get('/players')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.length).toEqual(1)
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: playerId })]),
    )
  })

  it('should return the player themselves even if theyre not on a team', async () => {
    const token = generateToken({ id: playerWithoutTeam, role: 'player' })

    const res = await supertest(app)
      .get('/players')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body.length).toEqual(1)
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: playerWithoutTeam }),
      ]),
    )
  })

  it('should not return players if the user is not authenticated', async () => {
    const res = await supertest(app).get('/players')

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })
})

describe('DELETE /players/:id', () => {
  let playerId
  let anotherPlayerId

  beforeEach(async () => {
    playerId = (
      await createPlayer(
        db,
        'Player1',
        'player1@example.com',
        '+1111111111',
        await hashPassword('player123'),
      )
    ).id

    anotherPlayerId = (
      await createPlayer(
        db,
        'Player2',
        'player2@example.com',
        '+2222222222',
        await hashPassword('player234'),
      )
    ).id
  })

  afterEach(async () => {
    await db.run('DELETE FROM players')
  })

  it('should delete the player if the user is authenticated and authorized', async () => {
    const token = generateToken({ id: playerId, role: 'player' })

    const res = await supertest(app)
      .delete(`/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toEqual(expect.objectContaining({ id: playerId }))
  })

  it('should not delete the player if the user is not authorized', async () => {
    const token = generateToken({ id: playerId, role: 'player' })

    const res = await supertest(app)
      .delete(`/players/${anotherPlayerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(403)
    expect(res.body.message).toEqual(
      'You are not authorized to delete this player.',
    )
  })

  it('should not delete the player if the user is not authenticated', async () => {
    const res = await supertest(app).delete(`/players/${playerId}`)

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })

  it('should return a 404 error if the player is not found', async () => {
    const nonExistentPlayerId = 9999
    const token = generateToken({ id: nonExistentPlayerId, role: 'player' })

    const res = await supertest(app)
      .delete(`/players/${nonExistentPlayerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(404)
    expect(res.body.message).toEqual('Player not found.')
  })

  it('should return a 403 error if you try to delete a player who isnt you', async () => {
    const token = generateToken({ id: playerId, role: 'player' })

    const res = await supertest(app)
      .delete(`/players/${anotherPlayerId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(403)
    expect(res.body.message).toEqual(
      'You are not authorized to delete this player.',
    )
  })
})
