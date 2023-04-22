import supertest from 'supertest';
import express from 'express';
import initDatabase from '../db';
import setupPlayerRoutes from './playerRoutes';
import { Database } from 'sqlite';
import { generateToken, hashPassword } from '../auth';

const app = express();
app.use(express.json());

let db: Database;

beforeAll(async () => {
  db = await initDatabase();
  app.use(setupPlayerRoutes(db));
});

afterAll(async () => {
  await db.close();
});

describe('Player routes', () => {
  const playerData = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    cellphone: '+1234567890',
    password: 'test123',
  };

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run('DELETE FROM players');
  });

  it('should create a new player', async () => {
    const res = await supertest(app).post('/players').send(playerData);

    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(playerData.name);
    expect(res.body.email).toEqual(playerData.email);
    expect(res.body.cellphone).toEqual(playerData.cellphone);
  });

  it('should login with the correct credentials', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password);
    const { lastID } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ]
    );

    const res = await supertest(app)
      .post('/players/login')
      .send({ email: playerData.email, password: playerData.password });

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail login with incorrect credentials', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password);
    const { lastID } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ]
    );

    const res = await supertest(app)
      .post('/players/login')
      .send({ email: playerData.email, password: 'wrongpassword' });

    expect(res.status).toEqual(401);
  });

  it('should read one player', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password);
    const { lastID } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ]
    );
    const token = generateToken({ id: lastID, role: 'player' });

    const res = await supertest(app)
      .get(`/players/${lastID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(playerData.name);
    expect(res.body.email).toEqual(playerData.email);
    expect(res.body.cellphone).toEqual(playerData.cellphone);
  });

  it('should read many players', async () => {
    // Create test players for this test
    const hashedPassword = await hashPassword(playerData.password);
    await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ]
    );
    const { lastID } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        'Jane Doe',
        'janedoe@example.com',
        '+1234567891',
        hashedPassword,
        'player',
      ]
    );
    const token = generateToken({ id: lastID, role: 'player' });

    const res = await supertest(app)
      .get('/players')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveLength(2);
  });

  it('should update a player', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password);
    const { lastID } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ]
    );

    const updatedPlayerData = {
      name: 'John Updated',
      email: 'johnupdated@example.com',
      cellphone: '+1234567899',
    };
    const token = generateToken({ id: lastID, role: 'player' });

    const res = await supertest(app)
      .put(`/players/${lastID}`)
      .send(updatedPlayerData)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(updatedPlayerData.name);
    expect(res.body.email).toEqual(updatedPlayerData.email);
    expect(res.body.cellphone).toEqual(updatedPlayerData.cellphone);
  });

  it('should delete a player', async () => {
    // Create a test player for this test
    const hashedPassword = await hashPassword(playerData.password);
    const { lastID } = await db.run(
      'INSERT INTO players (name, email, cellphone, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        playerData.name,
        playerData.email,
        playerData.cellphone,
        hashedPassword,
        'player',
      ]
    );
    const token = generateToken({ id: lastID, role: 'player' });

    const res = await supertest(app)
      .delete(`/players/${lastID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(playerData.name);
    expect(res.body.email).toEqual(playerData.email);
    expect(res.body.cellphone).toEqual(playerData.cellphone);
  });
});
