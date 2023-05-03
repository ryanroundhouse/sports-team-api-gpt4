export interface Player {
  id: number;
  name: string;
  email: string;
  cellphone: string;
  password: string;
  player: string;
  role: string;
}

export interface Team {
  id: number;
  name: string;
}

export interface TeamMembership {
  id: number;
  teamId: number;
  playerId: number;
  isCaptain: boolean;
}

export interface Game {
  id: number;
  location: string;
  opposingTeam: string;
  time: Date;
  notes: string;
  teamId: number;
}

export interface Attendance {
  id: number;
  playerId: number;
  gameId: number;
  status: string;
}
