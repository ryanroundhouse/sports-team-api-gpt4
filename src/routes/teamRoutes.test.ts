import supertest from 'supertest';
import express from 'express';
import initDatabase from '../db';
import setupTeamRoutes from './teamRoutes';
import { Database } from 'sqlite';
import { generateToken, hashPassword } from '../auth';
import { createTeamMembership } from '../dataAccess/teamMembershipData';
import {
  createTeam,
  getTeamById,
  getTeams,
  updateTeam,
  deleteTeam,
} from '../dataAccess/teamData';

const app = express();
app.use(express.json());

let db: Database;

const playerData = {
  playerId: 1,
  name: 'John Doe',
  email: 'johndoe@example.com',
  cellphone: '+1234567890',
  password: 'test123',
  role: 'player',
};

beforeAll(async () => {
  db = await initDatabase();
  app.use(setupTeamRoutes(db));
});

afterAll(async () => {
  await db.close();
});

describe('Team routes', () => {
  const teamData = {
    name: 'Test Team',
  };

  beforeEach(async () => {
    const hashedCaptainPassword = await hashPassword(playerData.password);
    await db.run(
      'INSERT INTO players (id, name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [
        playerData.playerId,
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedCaptainPassword,
        playerData.role,
      ]
    );
  });

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run('DELETE FROM teams');
    await db.run('DELETE FROM players');
    await db.run('DELETE FROM team_memberships');
  });

  it('should create a new team', async () => {
    const token = generateToken({ id: playerData.playerId, role: 'player' });

    const res = await supertest(app)
      .post('/teams')
      .set('Authorization', `Bearer ${token}`)
      .send(teamData);

    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(teamData.name);
  });

  it('should read one team', async () => {
    const token = generateToken({ id: playerData.playerId, role: 'player' });

    const createdTeam = await createTeam(db, teamData.name);

    const res = await supertest(app)
      .get(`/teams/${createdTeam}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(teamData.name);
  });

  it('should read many teams', async () => {
    await createTeam(db, teamData.name);
    await createTeam(db, 'Another Test Team');
    const token = generateToken({ id: playerData.playerId, role: 'player' });

    const res = await supertest(app)
      .get('/teams')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(2);
  });

  it('should update a team', async () => {
    const createdTeam = (await createTeam(db, teamData.name)) ?? 1;

    const membership = await createTeamMembership(
      db,
      createdTeam,
      playerData.playerId,
      true
    );

    const updatedTeamData = {
      name: 'Updated Test Team',
    };
    const token = generateToken({ id: playerData.playerId, role: 'player' });

    const res = await supertest(app)
      .put(`/teams/${createdTeam}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedTeamData);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(updatedTeamData.name);
  });

  it('should delete a team', async () => {
    const token = generateToken({ id: playerData.playerId, role: 'player' });
    const createdTeam = (await createTeam(db, teamData.name)) ?? 1;
    const membership = await createTeamMembership(
      db,
      createdTeam,
      playerData.playerId,
      true
    );

    const res = await supertest(app)
      .delete(`/teams/${createdTeam}`)
      .set('Authorization', `Bearer ${token}`);

    const deletedTeam = await getTeamById(db, createdTeam);

    expect(deletedTeam).toBeUndefined();
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(teamData.name);
  });
});
