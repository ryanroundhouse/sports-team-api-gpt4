import supertest from 'supertest';
import express from 'express';
import initDatabase from '../db';
import setupTeamMembershipRoutes from './teamMembershipRoutes';
import { Database } from 'sqlite';
import { generateToken, hashPassword } from '../auth';
import {
  createTeamMembership,
  getTeamMembershipByTeamAndPlayer,
} from '../dataAccess/teamMembershipData';

const app = express();
app.use(express.json());

let db: Database;

beforeAll(async () => {
  db = await initDatabase();
  app.use(setupTeamMembershipRoutes(db));
});

afterAll(async () => {
  await db.close();
});

describe('Team Membership routes', () => {
  const teamCaptainPlayerData = {
    playerId: 1,
    name: 'John Doe',
    email: 'johndoe@example.com',
    cellphone: '+1234567890',
    password: 'test123',
    role: 'player',
  };
  const newPlayerData = {
    playerId: 2,
    name: 'Paul Bunyan',
    email: 'pbunyan@example.com',
    cellphone: '+0987654321',
    password: 'welcome',
    role: 'player',
  };

  const existingTeamData = {
    teamId: 1,
    name: 'Test Team',
  };

  const teamCaptainMembershipData = {
    teamId: existingTeamData.teamId,
    playerId: teamCaptainPlayerData.playerId,
    isCaptain: true,
  };

  beforeEach(async () => {
    const hashedCaptainPassword = await hashPassword(
      teamCaptainPlayerData.password
    );
    await db.run(
      'INSERT INTO players (id, name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [
        teamCaptainPlayerData.playerId,
        teamCaptainPlayerData.name,
        teamCaptainPlayerData.email,
        teamCaptainPlayerData.cellphone,
        hashedCaptainPassword,
        teamCaptainPlayerData.role,
      ]
    );
    const hashedPlayerPassword = await hashPassword(
      teamCaptainPlayerData.password
    );
    await db.run(
      'INSERT INTO players (id, name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [
        newPlayerData.playerId,
        newPlayerData.name,
        newPlayerData.email,
        newPlayerData.cellphone,
        hashedPlayerPassword,
        newPlayerData.role,
      ]
    );

    await db.run('INSERT INTO teams (id, name) VALUES (?, ?)', [
      existingTeamData.teamId,
      existingTeamData.name,
    ]);

    createTeamMembership(
      db,
      existingTeamData.teamId,
      teamCaptainPlayerData.playerId,
      true
    );
  });

  afterEach(async () => {
    await db.run('DELETE FROM team_memberships');
    await db.run('DELETE FROM teams');
    await db.run('DELETE FROM players');
  });

  it('should create a new team membership', async () => {
    const token = generateToken({
      id: teamCaptainPlayerData.playerId,
      role: teamCaptainPlayerData.role,
    });

    const res = await supertest(app)
      .post(`/teams/${existingTeamData.teamId}/team-memberships`)
      .send({ playerId: newPlayerData.playerId, isCaptain: false })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.playerId).toEqual(newPlayerData.playerId);
    expect(res.body.teamId).toEqual(existingTeamData.teamId);
    expect(res.body.isCaptain).toBeFalsy();
  });

  it('should read many team memberships', async () => {
    const token = generateToken({
      id: teamCaptainPlayerData.playerId,
      role: teamCaptainPlayerData.role,
    });

    // Create a second team membership for testing
    createTeamMembership(
      db,
      existingTeamData.teamId,
      newPlayerData.playerId,
      false
    );

    const res = await supertest(app)
      .get(`/teams/${existingTeamData.teamId}/team-memberships`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].playerId).toEqual(teamCaptainPlayerData.playerId);
    expect(res.body[0].teamId).toEqual(existingTeamData.teamId);
    expect(res.body[0].isCaptain).toBeTruthy();
  });

  it('should read one team membership', async () => {
    const token = generateToken({
      id: teamCaptainPlayerData.playerId,
      role: teamCaptainPlayerData.role,
    });

    // Get a team membership for testing
    const { id } = (await getTeamMembershipByTeamAndPlayer(
      db,
      existingTeamData.teamId,
      teamCaptainPlayerData.playerId
    )) ?? { id: -1 };

    const res = await supertest(app)
      .get(`/teams/${existingTeamData.teamId}/team-memberships/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(id);
    expect(res.body.playerId).toEqual(teamCaptainPlayerData.playerId);
    expect(res.body.teamId).toEqual(existingTeamData.teamId);
    expect(res.body.isCaptain).toBeTruthy();
  });

  it('should update a team membership', async () => {
    const token = generateToken({
      id: teamCaptainPlayerData.playerId,
      role: teamCaptainPlayerData.role,
    });

    // Get a team membership for testing
    const { id } = (await getTeamMembershipByTeamAndPlayer(
      db,
      existingTeamData.teamId,
      teamCaptainPlayerData.playerId
    )) ?? { id: -1 };

    const res = await supertest(app)
      .put(`/teams/${existingTeamData.teamId}/team-memberships/${id}`)
      .send({ playerId: teamCaptainPlayerData.playerId, isCaptain: false })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(id);
    expect(res.body.playerId).toEqual(teamCaptainPlayerData.playerId);
    expect(res.body.teamId).toEqual(existingTeamData.teamId);
    expect(res.body.isCaptain).toBeFalsy();
  });

  it('should delete a team membership', async () => {
    const token = generateToken({
      id: teamCaptainPlayerData.playerId,
      role: teamCaptainPlayerData.role,
    });

    // Create a second team membership for testing
    const { id } = (await createTeamMembership(
      db,
      existingTeamData.teamId,
      newPlayerData.playerId,
      false
    )) ?? { id: -1 };

    const res = await supertest(app)
      .delete(`/teams/${existingTeamData.teamId}/team-memberships/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(id);
    expect(res.body.playerId).toEqual(newPlayerData.playerId);
    expect(res.body.teamId).toEqual(existingTeamData.teamId);
    expect(res.body.isCaptain).toBeFalsy();
  });

  it('should not allow deleting a team membership if not the captain or the member', async () => {
    // Create a new player who is not a member nor the captain of the team
    const unrelatedPlayerData = {
      playerId: 3,
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      cellphone: '+111223344',
      password: 'random123',
      role: 'player',
    };

    const hashedUnrelatedPlayerPassword = await hashPassword(
      unrelatedPlayerData.password
    );
    await db.run(
      'INSERT INTO players (id, name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [
        unrelatedPlayerData.playerId,
        unrelatedPlayerData.name,
        unrelatedPlayerData.email,
        unrelatedPlayerData.cellphone,
        hashedUnrelatedPlayerPassword,
        unrelatedPlayerData.role,
      ]
    );

    const token = generateToken({
      id: unrelatedPlayerData.playerId,
      role: unrelatedPlayerData.role,
    });

    // Create a team membership for testing
    const { id } = (await createTeamMembership(
      db,
      existingTeamData.teamId,
      newPlayerData.playerId,
      false
    )) ?? { id: -1 };

    const res = await supertest(app)
      .delete(`/teams/${existingTeamData.teamId}/team-memberships/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(403);
  });

  it('should not allow updating a team membership if not the captain or the member', async () => {
    // Create a new player who is not a member nor the captain of the team
    const unrelatedPlayerData = {
      playerId: 3,
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      cellphone: '+111223344',
      password: 'random123',
      role: 'player',
    };

    const hashedUnrelatedPlayerPassword = await hashPassword(
      unrelatedPlayerData.password
    );
    await db.run(
      'INSERT INTO players (id, name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [
        unrelatedPlayerData.playerId,
        unrelatedPlayerData.name,
        unrelatedPlayerData.email,
        unrelatedPlayerData.cellphone,
        hashedUnrelatedPlayerPassword,
        unrelatedPlayerData.role,
      ]
    );

    const token = generateToken({
      id: unrelatedPlayerData.playerId,
      role: unrelatedPlayerData.role,
    });

    // Create a team membership for testing
    const { id } = (await createTeamMembership(
      db,
      existingTeamData.teamId,
      newPlayerData.playerId,
      false
    )) ?? { id: -1 };

    const res = await supertest(app)
      .put(`/teams/${existingTeamData.teamId}/team-memberships/${id}`)
      .send({ playerId: unrelatedPlayerData.playerId, isCaptain: false })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(403);
  });
});
