import { Database } from 'sqlite';
import { TeamMembership } from '../models';

export const createTeamMembership = async (
  db: Database,
  team_id: number,
  player_id: number,
  is_captain: boolean
): Promise<TeamMembership | undefined> => {
  const result = await db.run(
    'INSERT INTO team_memberships (team_id, player_id, is_captain) VALUES (?, ?, ?)',
    [team_id, player_id, is_captain]
  );
  const newMembershipId = result.lastID;
  return await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE id = ?',
    newMembershipId
  );
};

export const getTeamMembershipByTeamAndPlayer = async (
  db: Database,
  team_id: number,
  player_id: number
): Promise<TeamMembership | undefined> => {
  return await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE team_id = ? AND player_id = ?',
    [team_id, player_id]
  );
};

export const getCaptainMembershipByTeamAndPlayer = async (
  db: Database,
  team_id: number,
  player_id: number
): Promise<TeamMembership | undefined> => {
  return await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE team_id = ? AND player_id = ? AND is_captain = 1',
    [team_id, player_id]
  );
};

export const getTeamMembershipsByTeam = async (
  db: Database,
  team_id: number
): Promise<TeamMembership | undefined> => {
  return await db.all(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE team_id = ?',
    team_id
  );
};

export const getTeamMembershipByPlayerIdAndTeam = async (
  db: Database,
  id: number,
  team_id: number
): Promise<TeamMembership | undefined> => {
  return await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE player_id = ? AND team_id = ?',
    [id, team_id]
  );
};

export const getTeamMembershipById = async (
  db: Database,
  id: number
): Promise<TeamMembership | undefined> => {
  return await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE id = ?',
    [id]
  );
};

export const updateTeamMembership = async (
  db: Database,
  id: number,
  team_id: number,
  player_id: number,
  is_captain: boolean
): Promise<TeamMembership | undefined> => {
  await db.run(
    'UPDATE team_memberships SET player_id = ?, is_captain = ? WHERE id = ? AND team_id = ?',
    [player_id, is_captain, id, team_id]
  );
  return await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE id = ? AND team_id = ?',
    [id, team_id]
  );
};

export async function deleteTeamMembershipsByTeam(
  db: Database,
  team_id: number
): Promise<TeamMembership | undefined> {
  try {
    const teamMembershipToDelete = await getTeamMembershipById(db, team_id);
    await db.run('DELETE FROM team_memberships WHERE team_id = ?', team_id);
    return teamMembershipToDelete;
  } catch (error) {
    throw new Error('An error occurred while deleting team memberships.');
  }
}

export const isUserCaptainOfTeam = async (
  db: Database,
  userId: number,
  team_id: number
): Promise<boolean> => {
  const captainMembership = await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE team_id = ? AND player_id = ? AND is_captain = 1',
    [team_id, userId]
  );

  return !!captainMembership;
};

export async function getTeamMembershipsByPlayerId(
  db: Database,
  playerId: number
): Promise<TeamMembership[]> {
  return await db.all(
    `
      SELECT
        id,
        team_id AS teamId,
        player_id AS playerId,
        is_captain AS isCaptain
      FROM team_memberships
      WHERE player_id = ?
    `,
    playerId
  );
}

export const deleteTeamMembership = async (
  db: Database,
  id: number,
  team_id: number
): Promise<TeamMembership | undefined> => {
  const deletedMembership = await db.get(
    'SELECT id, team_id AS teamId, player_id AS playerId, is_captain AS isCaptain FROM team_memberships WHERE id = ? AND team_id = ?',
    [id, team_id]
  );
  await db.run('DELETE FROM team_memberships WHERE id = ? AND team_id = ?', [
    id,
    team_id,
  ]);
  return deletedMembership;
};
