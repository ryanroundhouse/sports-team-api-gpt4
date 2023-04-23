import { Database } from 'sqlite';

export const createTeamMembership = async (
  db: Database,
  team_id: number,
  player_id: number,
  is_captain: boolean
) => {
  const result = await db.run(
    'INSERT INTO team_memberships (team_id, player_id, is_captain) VALUES (?, ?, ?)',
    [team_id, player_id, is_captain]
  );
  const newMembershipId = result.lastID;
  return await db.get(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE id = ?',
    newMembershipId
  );
};

export const getTeamMembershipByTeamAndPlayer = async (
  db: Database,
  team_id: number,
  player_id: number
) => {
  return await db.get(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE team_id = ? AND player_id = ?',
    [team_id, player_id]
  );
};

export const getCaptainMembershipByTeamAndPlayer = async (
  db: Database,
  team_id: number,
  player_id: number
) => {
  return await db.get(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE team_id = ? AND player_id = ? AND is_captain = 1',
    [team_id, player_id]
  );
};

export const getTeamMembershipsByTeam = async (
  db: Database,
  team_id: number
) => {
  return await db.all(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE team_id = ?',
    team_id
  );
};

export const getTeamMembershipByIdAndTeam = async (
  db: Database,
  id: number,
  team_id: number
) => {
  return await db.get(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE id = ? AND team_id = ?',
    [id, team_id]
  );
};

export const updateTeamMembership = async (
  db: Database,
  id: number,
  team_id: number,
  player_id: number,
  is_captain: boolean
) => {
  await db.run(
    'UPDATE team_memberships SET player_id = ?, is_captain = ? WHERE id = ? AND team_id = ?',
    [player_id, is_captain, id, team_id]
  );
  return await db.get(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE id = ? AND team_id = ?',
    [id, team_id]
  );
};

export async function deleteTeamMembershipsByTeam(
  db: Database,
  team_id: number
): Promise<void> {
  try {
    await db.run('DELETE FROM team_memberships WHERE team_id = ?', team_id);
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
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE team_id = ? AND player_id = ? AND is_captain = 1',
    [team_id, userId]
  );

  return !!captainMembership;
};

export const deleteTeamMembership = async (
  db: Database,
  id: number,
  team_id: number
) => {
  const deletedMembership = await db.get(
    'SELECT id, team_id, player_id, is_captain FROM team_memberships WHERE id = ? AND team_id = ?',
    [id, team_id]
  );
  await db.run('DELETE FROM team_memberships WHERE id = ? AND team_id = ?', [
    id,
    team_id,
  ]);
  return deletedMembership;
};
