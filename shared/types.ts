export interface LastSubmission {
  stem: string;
  submission: string;
  isSubmissionPrefix: boolean;
}

export interface PlayerData {
  name: string,
  score: number,
  ready: boolean,
  isAdmin: boolean,
  lastSubmission: LastSubmission | null,
}[];

export enum GameState {
  IDLE = "IDLE",
  WRITING = "WRITING",
};

export type GameData = {
  round: number;
  gameState: GameState;
  currentWord: string;
}

export interface ServerToClientEvents {
  connect: (roomToJoin:string) => void;
  disconnect: () => void;
  roomDoesNotExist: () => void;
  playerAlreadyExists: () => void;
  invalidPlayerName: () => void;
  joinGame: (roomName:string, playerData: PlayerData[]) => void;
  gameCreated: (roomName: string, playerData: PlayerData[]) => void;
  updateGameData: (playerData:PlayerData[], gameData:GameData, kickedPlayer?: string) => void;
}

export interface ClientToServerEvents {
  createGame: (playerName: string) => void;
  tryJoinGame: (roomName: string, playerName:string) => void;
  toggleReady: (roomName: string, playerName:string) => void;
  submitWord: (roomName: string, playerName:string, word:string) => void;
  kickPlayer: (roomName: string, playerName:string) => void;
  skipPlayer: (roomName: string, playerName:string) => void;
}
