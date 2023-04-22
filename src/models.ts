export interface Player {
  id: number;
  name: string;
  email: string;
  cellphone: string;
  password: string;
}

export interface Team {
  id: number;
  name: string;
  captainId: number;
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
