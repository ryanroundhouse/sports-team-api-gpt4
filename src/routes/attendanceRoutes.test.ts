import supertest from 'supertest'
import express from 'express'
import initDatabase from '../db'
import setupGameRoutes from './gameRoutes'
import setupPlayerRoutes from './playerRoutes'
import setupTeamRoutes from './teamRoutes'
import { Database } from 'sqlite'
import { generateToken, hashPassword } from '../auth'
import {
  createPlayer,
  deletePlayer,
  getPlayers,
} from '../dataAccess/playerData'
import { createTeam, getTeams } from '../dataAccess/teamData'
import {
  createTeamMembership,
  getTeamMembershipsByTeam,
} from '../dataAccess/teamMembershipData'
import { createGame, getAllGames, getGameById } from '../dataAccess/gameData'
import { Attendance, Game } from '../models'
import setupAttendanceRoutes from './attendanceRoutes'
import { createAttendance } from '../dataAccess/attendanceData'

const app = express()
app.use(express.json())

let db: Database

beforeAll(async () => {
  db = await initDatabase()
  app.use(setupPlayerRoutes(db))
  app.use(setupTeamRoutes(db))
  app.use(setupGameRoutes(db))
  app.use(setupAttendanceRoutes(db))
})

afterAll(async () => {
  await db.close()
})

describe('POST /attendance', () => {
  let captainId
  let nonCaptainId
  let nonTeamMemberPlayerId
  let teamId
  let gameId

  beforeEach(async () => {
    // Create players
    captainId = (
      await createPlayer(
        db,
        'Captain Player',
        'captainplayer@example.com',
        '+1234567890',
        await hashPassword('test123'),
      )
    ).id
    nonCaptainId = (
      await createPlayer(
        db,
        'Captain Player',
        'noncaptainplayer@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
    nonTeamMemberPlayerId = (
      await createPlayer(
        db,
        'nonTeamMember Player',
        'nonteammemberplayer@example.com',
        '+0987654321',
        await hashPassword('foreward'),
      )
    ).id

    // Create a team
    teamId = await createTeam(db, 'Test Team')

    // Create a game
    const gameData: Game = {
      id: 0,
      location: 'Test Location',
      opposingTeam: 'Test Opposing Team',
      time: new Date('2023-05-01T18:00:00.000Z'),
      notes: 'Test Notes',
      teamId: teamId,
    }
    gameId = (await createGame(db, gameData)).id
    await createTeamMembership(db, teamId, captainId, true)
    await createTeamMembership(db, teamId, nonCaptainId, false)
  })

  afterEach(async () => {
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM games')
    await db.run('DELETE FROM attendances')
  })

  it('should create attendance if the user is authenticated', async () => {
    const token = generateToken({ id: captainId, role: 'player' })

    const attendanceData = {
      playerId: captainId,
      gameId: gameId,
      status: 'present',
    }

    const res = await supertest(app)
      .post('/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send(attendanceData)

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.player_id).toEqual(captainId)
    expect(res.body.game_id).toEqual(gameId)
    expect(res.body.status).toEqual('present')
  })

  it('should not create attendance if the user is not authenticated', async () => {
    const attendanceData = {
      playerId: captainId,
      gameId: gameId,
      status: 'present',
    }

    const res = await supertest(app).post('/attendance').send(attendanceData)

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })
})

describe('GET /attendance', () => {
  let captainId
  let nonCaptainId
  let nonTeamMemberPlayerId
  let teamId
  let gameId
  let captainAttendanceId
  let nonCaptainAttendanceId

  beforeEach(async () => {
    // Create players
    captainId = (
      await createPlayer(
        db,
        'Captain Player',
        'captainplayer@example.com',
        '+1234567890',
        await hashPassword('test123'),
      )
    ).id
    nonCaptainId = (
      await createPlayer(
        db,
        'Captain Player',
        'noncaptainplayer@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
    nonTeamMemberPlayerId = (
      await createPlayer(
        db,
        'nonTeamMember Player',
        'nonteammemberplayer@example.com',
        '+0987654321',
        await hashPassword('foreward'),
      )
    ).id

    // Create a team
    teamId = await createTeam(db, 'Test Team')

    // Create a game
    const gameData: Game = {
      id: 0,
      location: 'Test Location',
      opposingTeam: 'Test Opposing Team',
      time: new Date('2023-05-01T18:00:00.000Z'),
      notes: 'Test Notes',
      teamId: teamId,
    }
    gameId = (await createGame(db, gameData)).id
    await createTeamMembership(db, teamId, captainId, true)
    await createTeamMembership(db, teamId, nonCaptainId, false)

    const captainAttendance: Attendance = {
      id: 0,
      playerId: captainId,
      gameId: gameId,
      status: 'present',
    }
    captainAttendanceId = (await createAttendance(db, captainAttendance)).id
    const nonCaptainAttendance: Attendance = {
      id: 0,
      playerId: nonCaptainId,
      gameId: gameId,
      status: 'absent',
    }
    nonCaptainAttendanceId = (await createAttendance(db, nonCaptainAttendance))
      .id
  })

  afterEach(async () => {
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM games')
    await db.run('DELETE FROM attendances')
  })

  it('should get all attendances if the user is authenticated', async () => {
    const token = generateToken({ id: captainId, role: 'player' })

    const res = await supertest(app)
      .get('/attendance')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0].player_id).toEqual(captainId)
    expect(res.body[0].game_id).toEqual(gameId)
    expect(res.body[0].status).toEqual('present')
    expect(res.body[1].player_id).toEqual(nonCaptainId)
    expect(res.body[1].game_id).toEqual(gameId)
    expect(res.body[1].status).toEqual('absent')
  })

  it('should not get all attendances if the user is not authenticated', async () => {
    const res = await supertest(app).get('/attendance')

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })
})

describe('GET /attendance/:id', () => {
  let captainId
  let nonCaptainId
  let nonTeamMemberPlayerId
  let teamId
  let gameId
  let captainAttendanceId
  let nonCaptainAttendanceId

  beforeEach(async () => {
    // Create players
    captainId = (
      await createPlayer(
        db,
        'Captain Player',
        'captainplayer@example.com',
        '+1234567890',
        await hashPassword('test123'),
      )
    ).id
    nonCaptainId = (
      await createPlayer(
        db,
        'Captain Player',
        'noncaptainplayer@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
    nonTeamMemberPlayerId = (
      await createPlayer(
        db,
        'nonTeamMember Player',
        'nonteammemberplayer@example.com',
        '+0987654321',
        await hashPassword('foreward'),
      )
    ).id

    // Create a team
    teamId = await createTeam(db, 'Test Team')

    // Create a game
    const gameData: Game = {
      id: 0,
      location: 'Test Location',
      opposingTeam: 'Test Opposing Team',
      time: new Date('2023-05-01T18:00:00.000Z'),
      notes: 'Test Notes',
      teamId: teamId,
    }
    gameId = (await createGame(db, gameData)).id
    await createTeamMembership(db, teamId, captainId, true)
    await createTeamMembership(db, teamId, nonCaptainId, false)

    const captainAttendance: Attendance = {
      id: 0,
      playerId: captainId,
      gameId: gameId,
      status: 'present',
    }
    captainAttendanceId = (await createAttendance(db, captainAttendance)).id
    const nonCaptainAttendance: Attendance = {
      id: 0,
      playerId: nonCaptainId,
      gameId: gameId,
      status: 'absent',
    }
    nonCaptainAttendanceId = (await createAttendance(db, nonCaptainAttendance))
      .id
  })

  afterEach(async () => {
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM games')
    await db.run('DELETE FROM attendances')
  })

  it('should get attendance by ID if the user is authenticated', async () => {
    const token = generateToken({ id: captainId, role: 'player' })

    const res = await supertest(app)
      .get(`/attendance/${captainAttendanceId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body.id).toEqual(captainAttendanceId)
    expect(res.body.player_id).toEqual(captainId)
    expect(res.body.game_id).toEqual(gameId)
    expect(res.body.status).toEqual('present')
  })

  it('should not get attendance by ID if the user is not authenticated', async () => {
    const res = await supertest(app).get(`/attendance/${captainAttendanceId}`)

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })

  it('should return a 404 status if the attendance ID does not exist', async () => {
    const token = generateToken({ id: captainId, role: 'player' })
    const nonExistentAttendanceId =
      captainAttendanceId + nonCaptainAttendanceId + 1

    const res = await supertest(app)
      .get(`/attendance/${nonExistentAttendanceId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(404)
    expect(res.body.message).toEqual('Attendance not found.')
  })
})

describe('PUT /attendance/:id', () => {
  let captainId
  let nonCaptainId
  let nonTeamMemberPlayerId
  let teamId
  let gameId
  let captainAttendanceId
  let nonCaptainAttendanceId

  beforeEach(async () => {
    // Create players
    captainId = (
      await createPlayer(
        db,
        'Captain Player',
        'captainplayer@example.com',
        '+1234567890',
        await hashPassword('test123'),
      )
    ).id
    nonCaptainId = (
      await createPlayer(
        db,
        'Captain Player',
        'noncaptainplayer@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
    nonTeamMemberPlayerId = (
      await createPlayer(
        db,
        'nonTeamMember Player',
        'nonteammemberplayer@example.com',
        '+0987654321',
        await hashPassword('foreward'),
      )
    ).id

    // Create a team
    teamId = await createTeam(db, 'Test Team')

    // Create a game
    const gameData: Game = {
      id: 0,
      location: 'Test Location',
      opposingTeam: 'Test Opposing Team',
      time: new Date('2023-05-01T18:00:00.000Z'),
      notes: 'Test Notes',
      teamId: teamId,
    }
    gameId = (await createGame(db, gameData)).id
    await createTeamMembership(db, teamId, captainId, true)
    await createTeamMembership(db, teamId, nonCaptainId, false)

    const captainAttendance: Attendance = {
      id: 0,
      playerId: captainId,
      gameId: gameId,
      status: 'present',
    }
    captainAttendanceId = (await createAttendance(db, captainAttendance)).id
    const nonCaptainAttendance: Attendance = {
      id: 0,
      playerId: nonCaptainId,
      gameId: gameId,
      status: 'absent',
    }
    nonCaptainAttendanceId = (await createAttendance(db, nonCaptainAttendance))
      .id
  })

  afterEach(async () => {
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM games')
    await db.run('DELETE FROM attendances')
  })

  it('should update attendance by ID if the user is authenticated', async () => {
    const token = generateToken({ id: captainId, role: 'player' })

    const updatedAttendanceData = {
      playerId: captainId,
      gameId: gameId,
      status: 'absent',
    }

    const res = await supertest(app)
      .put(`/attendance/${captainAttendanceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedAttendanceData)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body.id).toEqual(captainAttendanceId)
    expect(res.body.player_id).toEqual(captainId)
    expect(res.body.game_id).toEqual(gameId)
    expect(res.body.status).toEqual('absent')
  })

  it('should not update attendance by ID if the user is not authenticated', async () => {
    const updatedAttendanceData = {
      playerId: captainId,
      gameId: gameId,
      status: 'absent',
    }

    const res = await supertest(app)
      .put(`/attendance/${captainAttendanceId}`)
      .send(updatedAttendanceData)

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })

  it('should return a 404 status if the attendance ID does not exist', async () => {
    const token = generateToken({ id: captainId, role: 'player' })
    const nonExistentAttendanceId =
      captainAttendanceId + nonCaptainAttendanceId + 1

    const updatedAttendanceData = {
      playerId: captainId,
      gameId: gameId,
      status: 'absent',
    }

    const res = await supertest(app)
      .put(`/attendance/${nonExistentAttendanceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedAttendanceData)

    expect(res.status).toEqual(404)
    expect(res.body.message).toEqual('Attendance not found.')
  })
})

describe('DELETE /attendance/:id', () => {
  let captainId
  let nonCaptainId
  let nonTeamMemberPlayerId
  let teamId
  let gameId
  let captainAttendanceId
  let nonCaptainAttendanceId

  beforeEach(async () => {
    // Create players
    captainId = (
      await createPlayer(
        db,
        'Captain Player',
        'captainplayer@example.com',
        '+1234567890',
        await hashPassword('test123'),
      )
    ).id
    nonCaptainId = (
      await createPlayer(
        db,
        'Captain Player',
        'noncaptainplayer@example.com',
        '+0987654321',
        await hashPassword('test321'),
      )
    ).id
    nonTeamMemberPlayerId = (
      await createPlayer(
        db,
        'nonTeamMember Player',
        'nonteammemberplayer@example.com',
        '+0987654321',
        await hashPassword('foreward'),
      )
    ).id

    // Create a team
    teamId = await createTeam(db, 'Test Team')

    // Create a game
    const gameData: Game = {
      id: 0,
      location: 'Test Location',
      opposingTeam: 'Test Opposing Team',
      time: new Date('2023-05-01T18:00:00.000Z'),
      notes: 'Test Notes',
      teamId: teamId,
    }
    gameId = (await createGame(db, gameData)).id
    await createTeamMembership(db, teamId, captainId, true)
    await createTeamMembership(db, teamId, nonCaptainId, false)

    const captainAttendance: Attendance = {
      id: 0,
      playerId: captainId,
      gameId: gameId,
      status: 'present',
    }
    captainAttendanceId = (await createAttendance(db, captainAttendance)).id
    const nonCaptainAttendance: Attendance = {
      id: 0,
      playerId: nonCaptainId,
      gameId: gameId,
      status: 'absent',
    }
    nonCaptainAttendanceId = (await createAttendance(db, nonCaptainAttendance))
      .id
  })

  afterEach(async () => {
    await db.run('DELETE FROM teams')
    await db.run('DELETE FROM players')
    await db.run('DELETE FROM games')
    await db.run('DELETE FROM attendances')
  })

  it('should delete attendance by ID if the user is authenticated', async () => {
    const token = generateToken({ id: captainId, role: 'player' })

    const res = await supertest(app)
      .delete(`/attendance/${captainAttendanceId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('id')
    expect(res.body.id).toEqual(captainAttendanceId)
    expect(res.body.player_id).toEqual(captainId)
    expect(res.body.game_id).toEqual(gameId)
    expect(res.body.status).toEqual('present')
  })

  it('should not delete attendance by ID if the user is not authenticated', async () => {
    const res = await supertest(app).delete(
      `/attendance/${captainAttendanceId}`,
    )

    expect(res.status).toEqual(401)
    expect(res.body.message).toEqual('No token provided.')
  })

  it('should return a 404 status if the attendance ID does not exist', async () => {
    const token = generateToken({ id: captainId, role: 'player' })
    const nonExistentAttendanceId =
      captainAttendanceId + nonCaptainAttendanceId + 1

    const res = await supertest(app)
      .delete(`/attendance/${nonExistentAttendanceId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toEqual(404)
    expect(res.body.message).toEqual('Attendance not found.')
  })
})
