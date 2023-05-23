import supertest from "supertest";
import express from "express";
import initDatabase from "../db";
import setupGameRoutes from "./gameRoutes";
import setupPlayerRoutes from "./playerRoutes";
import setupTeamRoutes from "./teamRoutes";
import { Database } from "sqlite";
import { generateToken, hashPassword } from "../auth";
import {
  createPlayer,
  deletePlayer,
  getPlayers,
} from "../dataAccess/playerData";
import { createTeam, getTeams } from "../dataAccess/teamData";
import {
  createTeamMembership,
  getTeamMembershipsByPlayerId,
  getTeamMembershipsByTeam,
} from "../dataAccess/teamMembershipData";
import { createGame, getAllGames, getGameById } from "../dataAccess/gameData";
import { Attendance, Game } from "../models";
import { createAttendance } from "../dataAccess/attendanceData";

const app = express();
app.use(express.json());

let db: Database;

beforeAll(async () => {
  db = await initDatabase();
  app.use(setupPlayerRoutes(db));
  app.use(setupTeamRoutes(db));
  app.use(setupGameRoutes(db));
});

afterAll(async () => {
  await db.close();
});

describe("POST /games", () => {
  // Add the necessary data
  const captainData = {
    playerId: 1,
    name: "Captain",
    email: "captain@example.com",
    cellphone: "+1234567890",
    password: "test123",
    role: "player",
  };

  const teamData = {
    name: "Test Team",
  };

  const gameData = {
    location: "Test Location",
    opposingTeam: "Test Opposing Team",
    time: "2023-05-01T18:00:00.000Z",
    notes: "Test Notes",
    teamId: 1,
  };

  const missingGameData = {
    location: "Test Location",
    time: "2023-05-01T18:00:00.000Z",
    notes: "Test Notes",
    teamId: 2,
  };

  let captainId: number;
  let nonCaptainId: number;
  let teamId: number;

  beforeEach(async () => {
    // Create captain player
    const captain = (await createPlayer(
      db,
      "Captain",
      "captain@example.com",
      "+1234567890",
      await hashPassword("test123")
    )) ?? { id: -1 };
    captainId = captain.id;

    // Create non-captain player
    const nonCaptain = (await createPlayer(
      db,
      "Non-Captain",
      "non-captain@example.com",
      "+1234567891",
      await hashPassword("test123")
    )) ?? { id: -2 };
    nonCaptainId = nonCaptain.id;

    // Create team
    teamId = (await createTeam(db, "Test Team")) ?? 1;
    const captainMembershipId = await createTeamMembership(
      db,
      teamId,
      captainId,
      true
    );
    const nonCaptainMembershipId = await createTeamMembership(
      db,
      teamId,
      nonCaptainId,
      false
    );
  });

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run("DELETE FROM teams");
    await db.run("DELETE FROM players");
    await db.run("DELETE FROM team_memberships");
    await db.run("DELETE FROM games");
  });

  it("should create a new game if the user is the team captain", async () => {
    const token = generateToken({ id: captainData.playerId, role: "player" });

    const res = await supertest(app)
      .post("/games")
      .set("Authorization", `Bearer ${token}`)
      .send(gameData);

    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.location).toEqual(gameData.location);
    expect(res.body.opposingTeam).toEqual(gameData.opposingTeam);
    expect(res.body.notes).toEqual(gameData.notes);
    expect(res.body.teamId).toEqual(gameData.teamId);
  });

  it("should not create a new game if the user is not the team captain", async () => {
    // Prepare data for a non-captain user

    const token = generateToken({ id: nonCaptainId, role: "player" });

    const res = await supertest(app)
      .post("/games")
      .set("Authorization", `Bearer ${token}`)
      .send(gameData);

    expect(res.status).toEqual(403);
    expect(res.body.message).toEqual(
      "Only the team captain can create a game."
    );
  });
});

describe("GET /games", () => {
  const gameData1: Game = {
    id: 0, // This will be replaced by the auto-incrementing ID in the database.
    location: "Test Location 1",
    opposingTeam: "Test Opposing Team 1",
    time: new Date("2023-05-01T18:00:00.000Z"),
    notes: "Test Notes 1",
    teamId: 1,
  };
  const gameData2: Game = {
    id: 0, // This will be replaced by the auto-incrementing ID in the database.
    location: "Test Location 2",
    opposingTeam: "Test Opposing Team 2",
    time: new Date("2023-05-02T18:00:00.000Z"),
    notes: "Test Notes 2",
    teamId: 1,
  };
  const otherTeamGameData: Game = {
    id: 0, // This will be replaced by the auto-incrementing ID in the database.
    location: "Test Location 2",
    opposingTeam: "Test Opposing Team 2",
    time: new Date("2023-05-02T18:00:00.000Z"),
    notes: "Test Notes 2",
    teamId: 1,
  };
  let gameId1: number,
    gameId2: number,
    gameId3: number,
    captainId: number,
    nonCaptainId: number,
    teamId: number,
    otherTeamId: number,
    otherTeamPlayerId: number;

  beforeEach(async () => {
    const captain = (await createPlayer(
      db,
      "Captain",
      "captain@example.com",
      "+1234567890",
      await hashPassword("test123")
    )) ?? { id: -1 };
    captainId = captain.id;
    const nonCaptain = (await createPlayer(
      db,
      "NonCaptain",
      "nonCaptain@example.com",
      "+1234567890",
      await hashPassword("test123")
    )) ?? { id: -2 };
    nonCaptainId = nonCaptain.id;
    const otherTeamPlayer = (await createPlayer(
      db,
      "Other",
      "otherplayer@example.com",
      "+1234567890",
      await hashPassword("test123")
    )) ?? { id: -3 };
    otherTeamPlayerId = otherTeamPlayer.id;
    otherTeamGameData.id = otherTeamId;

    // Create team
    teamId = (await createTeam(db, "Test Team")) ?? 1;
    otherTeamId = (await createTeam(db, "Other team")) ?? 2;

    // Create games
    gameData1.teamId = teamId;
    const game1 = (await createGame(db, gameData1)) ?? { id: -1 };
    gameId1 = game1.id;
    gameData2.teamId = teamId;
    const game2 = (await createGame(db, gameData2)) ?? { id: -2 };
    gameId2 = game2.id;
    otherTeamGameData.teamId = otherTeamId;
    const game3 = (await createGame(db, otherTeamGameData)) ?? { id: -3 };
    gameId3 = game3.id;

    const captainMembershipId = await createTeamMembership(
      db,
      teamId,
      captainId,
      true
    );
    const nonCaptainMembershipId = await createTeamMembership(
      db,
      teamId,
      nonCaptainId,
      false
    );
  });

  afterEach(async () => {
    // Clean up the test data after each test
    await db.run("DELETE FROM teams");
    await db.run("DELETE FROM players");
    await db.run("DELETE FROM team_memberships");
    await db.run("DELETE FROM games");
  });

  it("should return all games if youre admin", async () => {
    const token = generateToken({ id: captainId, role: "admin" });

    const res = await supertest(app)
      .get("/games")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(3);
    expect(res.body[0].id).toEqual(gameId1);
    expect(res.body[1].id).toEqual(gameId2);
    expect(res.body[2].id).toEqual(gameId3);
  });

  it("should only return your teams games if not an admin", async () => {
    const token = generateToken({ id: nonCaptainId, role: "player" });

    const res = await supertest(app)
      .get("/games")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.length).toEqual(2);
    expect(res.body[0].id).toEqual(gameId1);
    expect(res.body[1].id).toEqual(gameId2);
  });
});

describe("PUT /games/:id", () => {
  const captainData = {
    playerId: 1,
    name: "Captain",
    email: "captain@example.com",
    cellphone: "+1234567890",
    password: "test123",
    role: "player",
  };

  const teamData = {
    name: "Test Team",
  };

  const gameData = {
    location: "Test Location",
    opposingTeam: "Test Opposing Team",
    time: "2023-05-01T18:00:00.000Z",
    notes: "Test Notes",
    teamId: 1,
  };

  let captainId: number;
  let nonCaptainId: number;
  let teamId: number;
  let gameId: number;

  beforeEach(async () => {
    captainId = (
      (await createPlayer(
        db,
        captainData.name,
        captainData.email,
        captainData.cellphone,
        await hashPassword(captainData.password)
      )) ?? { id: -1 }
    ).id;

    nonCaptainId = (
      (await createPlayer(
        db,
        "Non-Captain",
        "non-captain@example.com",
        "+1234567891",
        await hashPassword("test123")
      )) ?? { id: -2 }
    ).id;

    teamId = (await createTeam(db, teamData.name)) ?? 1;
    gameData.teamId = teamId;

    await createTeamMembership(db, teamId, captainId, true);
    await createTeamMembership(db, teamId, nonCaptainId, false);

    const gameData1: Game = {
      id: 0, // This will be replaced by the auto-incrementing ID in the database.
      location: "Test Location 1",
      opposingTeam: "Test Opposing Team 1",
      time: new Date("2023-05-01T18:00:00.000Z"),
      notes: "Test Notes 1",
      teamId: teamId,
    };

    gameId = ((await createGame(db, gameData1)) ?? { id: -1 }).id;
  });

  afterEach(async () => {
    await db.run("DELETE FROM teams");
    await db.run("DELETE FROM players");
    await db.run("DELETE FROM team_memberships");
    await db.run("DELETE FROM games");
  });

  it("should update the game if the user is the team captain", async () => {
    const token = generateToken({ id: captainId, role: "player" });
    const newLocation = "Updated Location";

    const res = await supertest(app)
      .put(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...gameData, location: newLocation });

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("id", gameId);
    expect(res.body.location).toEqual(newLocation);
  });

  it("should not update the game if the user is not the team captain", async () => {
    const token = generateToken({ id: nonCaptainId, role: "player" });
    const newLocation = "Updated Location";

    const res = await supertest(app)
      .put(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...gameData, location: newLocation });

    expect(res.status).toEqual(403);
    expect(res.body.message).toEqual(
      "Only the team captain can update a game."
    );
  });
});

describe("DELETE /games/:id", () => {
  const captainData = {
    playerId: 1,
    name: "Captain",
    email: "captain@example.com",
    cellphone: "+1234567890",
    password: "test123",
    role: "player",
  };

  const teamData = {
    name: "Test Team",
  };

  const gameData = {
    location: "Test Location",
    opposingTeam: "Test Opposing Team",
    time: "2023-05-01T18:00:00.000Z",
    notes: "Test Notes",
    teamId: 1,
  };

  let captainId: number;
  let nonCaptainId: number;
  let teamId: number;
  let gameId: number;

  beforeEach(async () => {
    captainId = (
      (await createPlayer(
        db,
        captainData.name,
        captainData.email,
        captainData.cellphone,
        await hashPassword(captainData.password)
      )) ?? { id: -1 }
    ).id;

    nonCaptainId = (
      (await createPlayer(
        db,
        "Non-Captain",
        "non-captain@example.com",
        "+1234567891",
        await hashPassword("test123")
      )) ?? { id: -2 }
    ).id;

    teamId = (await createTeam(db, teamData.name)) ?? 1;
    gameData.teamId = teamId;

    await createTeamMembership(db, teamId, captainId, true);
    await createTeamMembership(db, teamId, nonCaptainId, false);

    const gameData1: Game = {
      id: 0, // This will be replaced by the auto-incrementing ID in the database.
      location: "Test Location 1",
      opposingTeam: "Test Opposing Team 1",
      time: new Date("2023-05-01T18:00:00.000Z"),
      notes: "Test Notes 1",
      teamId: teamId,
    };

    gameId = ((await createGame(db, gameData1)) ?? { id: -1 }).id;
  });

  afterEach(async () => {
    await db.run("DELETE FROM teams");
    await db.run("DELETE FROM players");
    await db.run("DELETE FROM team_memberships");
    await db.run("DELETE FROM games");
  });

  it("should delete the game if the user is the team captain", async () => {
    const token = generateToken({ id: captainId, role: "player" });

    const res = await supertest(app)
      .delete(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    const games = await getGameById(db, gameId);

    expect(res.status).toEqual(200);
    expect(games).toBe(undefined);
  });

  it("should not delete the game if the user is not the team captain", async () => {
    const token = generateToken({ id: nonCaptainId, role: "player" });

    const res = await supertest(app)
      .delete(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    const games = await getGameById(db, gameId);

    expect(res.status).toEqual(403);
    expect(res.body.message).toEqual(
      "Only the team captain can delete a game."
    );
    expect(games).toBeDefined();
  });
});

describe("GET /games/:id", () => {
  const adminData = {
    playerId: 1,
    name: "Admin",
    email: "admin@example.com",
    cellphone: "+1234567890",
    password: "test123",
    role: "admin",
  };

  const playerData = {
    playerId: 2,
    name: "Player",
    email: "player@example.com",
    cellphone: "+1234567891",
    password: "test123",
    role: "player",
  };

  const teamData = {
    name: "Test Team",
  };

  const gameData: Game = {
    location: "Test Location",
    opposingTeam: "Test Opposing Team",
    time: new Date("2023-05-01T18:00:00.000Z"),
    notes: "Test Notes",
    teamId: 1,
    id: 0, // this will be overwritten
  };

  let adminId: number;
  let playerId: number;
  let teamId: number;
  let gameId: number;

  beforeEach(async () => {
    adminId = (
      (await createPlayer(
        db,
        adminData.name,
        adminData.email,
        adminData.cellphone,
        await hashPassword(adminData.password)
      )) ?? { id: -1 }
    ).id;

    playerId = (
      (await createPlayer(
        db,
        playerData.name,
        playerData.email,
        playerData.cellphone,
        await hashPassword(playerData.password)
      )) ?? { id: -2 }
    ).id;

    teamId = (await createTeam(db, teamData.name)) ?? 1;
    gameData.teamId = teamId;

    await createTeamMembership(db, teamId, playerId, false);

    gameId = ((await createGame(db, gameData)) ?? { id: -1 }).id;
  });

  afterEach(async () => {
    await db.run("DELETE FROM teams");
    await db.run("DELETE FROM players");
    await db.run("DELETE FROM team_memberships");
    await db.run("DELETE FROM games");
  });

  it("should return the game if the user is an admin", async () => {
    const token = generateToken({ id: adminId, role: "admin" });

    const res = await supertest(app)
      .get(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(gameId);
  });

  it("should return the game if the user is a team member", async () => {
    const token = generateToken({ id: playerId, role: "player" });

    const res = await supertest(app)
      .get(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual(gameId);
  });

  it("should return a 403 error if the user is not a team member", async () => {
    const nonTeamMemberId = (
      (await createPlayer(
        db,
        "Non-Team Member",
        "non-team-member@example.com",
        "+1234567892",
        await hashPassword("test123")
      )) ?? { id: -1 }
    ).id;
    const token = generateToken({ id: nonTeamMemberId, role: "player" });

    const res = await supertest(app)
      .get(`/games/${gameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(403);
    expect(res.body.message).toEqual(
      "You are not authorized to view this game."
    );
  });

  it("should return a 404 error if the game does not exist", async () => {
    const nonExistentGameId = 999;
    const token = generateToken({ id: playerId, role: "player" });
    const res = await supertest(app)
      .get(`/games/${nonExistentGameId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(404);
    expect(res.body.message).toEqual("Game not found.");
  });
});

describe("GET /games/:id/attendance", () => {
  const adminData = {
    playerId: 1,
    name: "Admin",
    email: "admin@example.com",
    cellphone: "+1234567890",
    password: "test123",
    role: "admin",
  };

  const playerData = {
    playerId: 2,
    name: "Player",
    email: "player@example.com",
    cellphone: "+1234567891",
    password: "test123",
    role: "player",
  };

  const teamData = {
    name: "Test Team",
  };

  const gameData: Game = {
    location: "Test Location",
    opposingTeam: "Test Opposing Team",
    time: new Date("2023-05-01T18:00:00.000Z"),
    notes: "Test Notes",
    teamId: 1,
    id: 0, // this will be overwritten
  };

  let adminId: number;
  let playerId: number;
  let teamId: number;
  let gameId: number;
  let playerAttendance: Attendance;

  beforeEach(async () => {
    adminId = (
      (await createPlayer(
        db,
        adminData.name,
        adminData.email,
        adminData.cellphone,
        await hashPassword(adminData.password)
      )) ?? { id: -1 }
    ).id;

    playerId = (
      (await createPlayer(
        db,
        playerData.name,
        playerData.email,
        playerData.cellphone,
        await hashPassword(playerData.password)
      )) ?? { id: -2 }
    ).id;

    teamId = (await createTeam(db, teamData.name)) ?? 1;
    gameData.teamId = teamId;

    playerAttendance = {
      id: 0,
      playerId: playerId,
      gameId: gameId,
      status: "present",
    };

    await createTeamMembership(db, teamId, playerId, false);

    gameId = ((await createGame(db, gameData)) ?? { id: -1 }).id;
  });

  afterEach(async () => {
    await db.run("DELETE FROM teams");
    await db.run("DELETE FROM players");
    await db.run("DELETE FROM team_memberships");
    await db.run("DELETE FROM games");
  });

  it("should return the attendance if the user is an admin", async () => {
    const token = generateToken({ id: adminId, role: "admin" });
    const res = await supertest(app)
      .get(`/games/${gameId}/attendance`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(1);
  });

  it("should return the attendance if the user is a team member", async () => {
    const token = generateToken({ id: playerId, role: "player" });

    const res = await supertest(app)
      .get(`/games/${gameId}/attendance`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(1);
  });

  it("should return a 403 error if the user is not a team member", async () => {
    const nonTeamMemberId = (
      (await createPlayer(
        db,
        "Non-Team Member",
        "non-team-member@example.com",
        "+1234567892",
        await hashPassword("test123")
      )) ?? { id: -1 }
    ).id;
    const token = generateToken({ id: nonTeamMemberId, role: "player" });

    const res = await supertest(app)
      .get(`/games/${gameId}/attendance`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(403);
    expect(res.body.message).toEqual(
      "You are not authorized to view this game."
    );
  });

  it("should return a 404 error if the game does not exist", async () => {
    const nonExistentGameId = 999;
    const token = generateToken({ id: playerId, role: "player" });
    const res = await supertest(app)
      .get(`/games/${nonExistentGameId}/attendance`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(404);
    expect(res.body.message).toEqual("Game not found.");
  });

  it("should return both attending and unknown attendances if there is only 1 of 2 attendance for the game", async () => {
    const gameIdWithPartialAttendance = gameId; // assuming gameId has no attendances
    const unrespondedTeamMember = (
      (await createPlayer(
        db,
        "Unresponded Member",
        "unresponded-member@example.com",
        "+1234567892",
        await hashPassword("test123")
      )) ?? { id: -1 }
    ).id;
    await createTeamMembership(db, teamId, unrespondedTeamMember, true);
    await createAttendance(db, playerAttendance);

    const token = generateToken({ id: playerId, role: "player" });
    const res = await supertest(app)
      .get(`/games/${gameIdWithPartialAttendance}/attendance`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(2);
  });

  it("should return a 401 error if the user is not logged in", async () => {
    const res = await supertest(app).get(`/games/${gameId}/attendance`);

    expect(res.status).toEqual(401);
    expect(res.body.message).toEqual("No token provided.");
  });
});
