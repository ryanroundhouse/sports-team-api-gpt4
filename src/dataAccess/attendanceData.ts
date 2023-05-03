import { Database } from 'sqlite';
import { Attendance } from '../models';

export async function createAttendance(
  db: Database,
  attendance: Attendance
): Promise<Attendance | undefined> {
  const result = await db.run(
    'INSERT INTO attendances (player_id, game_id, status) VALUES (?, ?, ?)',
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
    'SELECT id, player_id AS playerId, game_id AS gameId, status FROM attendances WHERE id = ?',
    id
  );
}

export async function getAllAttendances(
  db: Database
): Promise<Array<Attendance>> {
  return await db.all(
    'SELECT id, player_id AS playerId, game_id AS gameId, status FROM attendances'
  );
}

export async function updateAttendance(
  db: Database,
  id: number,
  attendance: Attendance
): Promise<Attendance | undefined> {
  await db.run(
    'UPDATE attendances SET player_id = ?, game_id = ?, status = ? WHERE id = ?',
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
    await db.run('DELETE FROM attendances WHERE id = ?', id);
  }

  return deletedAttendance;
}
