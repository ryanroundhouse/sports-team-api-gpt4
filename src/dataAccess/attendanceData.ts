import { Database } from "sqlite";
import { Attendance } from "../models";
import { getTeamMembershipsByTeam } from "./teamMembershipData";
import { getGameById } from "./gameData";

export async function createAttendance(
  db: Database,
  attendance: Attendance
): Promise<Attendance | undefined> {
  const result = await db.run(
    "INSERT INTO attendances (player_id, game_id, status) VALUES (?, ?, ?)",
    [attendance.playerId, attendance.gameId, attendance.status]
  );

  const newAttendanceId = result.lastID;
  if (!newAttendanceId) {
    throw "couldn't create attendance";
  }

  return getAttendanceById(db, newAttendanceId);
}

export async function getAttendanceById(
  db: Database,
  id: number
): Promise<Attendance | undefined> {
  return await db.get(
    "SELECT id, player_id AS playerId, game_id AS gameId, status FROM attendances WHERE id = ?",
    id
  );
}

export async function getAttendanceByGameId(
  db: Database,
  gameId: number
): Promise<Attendance[]> {
  const attendances: Array<Attendance> = [];
  const createdAttendances: Array<Attendance> | undefined = await db.all(
    "SELECT id, player_id AS playerId, game_id AS gameId, status FROM attendances WHERE game_id = ?",
    gameId
  );
  if (createdAttendances) {
    attendances.push(...createdAttendances);
  }

  const game = await getGameById(db, gameId);

  if (!game) {
    throw new Error("Game not found.");
  }

  // Fetch all team memberships for the game's team
  const teamMemberships = await getTeamMembershipsByTeam(db, game.teamId);

  if (teamMemberships) {
    // For each membership, if there's no corresponding attendance record, create a new one
    for (const membership of teamMemberships) {
      let attendanceExists = false;
      if (attendances) {
        attendanceExists = attendances.some(
          (attendance) => attendance.playerId === membership.playerId
        );
      }

      if (!attendanceExists) {
        const newAttendance = {
          playerId: membership.playerId,
          gameId: gameId,
          status: "unknown",
          id: 0, // this will be overwritten
        };

        // Add the new attendance to the attendances array
        attendances.push(newAttendance);
      }
    }
  }

  return attendances;
}

export async function getAllAttendances(
  db: Database
): Promise<Array<Attendance>> {
  return await db.all(
    "SELECT id, player_id AS playerId, game_id AS gameId, status FROM attendances"
  );
}

export async function updateAttendance(
  db: Database,
  id: number,
  attendance: Attendance
): Promise<Attendance | undefined> {
  await db.run(
    "UPDATE attendances SET player_id = ?, game_id = ?, status = ? WHERE id = ?",
    [attendance.playerId, attendance.gameId, attendance.status, id]
  );

  return getAttendanceById(db, id);
}

export async function deleteAttendance(
  db: Database,
  id: number
): Promise<Attendance | undefined> {
  const deletedAttendance = await getAttendanceById(db, id);

  if (deletedAttendance) {
    await db.run("DELETE FROM attendances WHERE id = ?", id);
  }

  return deletedAttendance;
}
