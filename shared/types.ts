export type PlayerData = {
  name: string,
  score: number,
  ready: boolean,
  isAdmin: boolean,
}[];

export interface ServerToClientEvents {
  connect: (roomToJoin:string) => void;
  disconnect: () => void;
  roomDoesNotExist: () => void;
  playerAlreadyExists: () => void;
  joinGame: (roomName:string, playerData: PlayerData) => void;
  gameCreated: (roomName: string, playerData: PlayerData) => void;
  newPlayerData: (playerData:PlayerData) => void;
}

export interface ClientToServerEvents {
  createGame: (playerName: string) => void;
  tryJoinGame: (roomName: string, playerName:string) => void;
  submitWord: (word:string) => void;
  toggleReady: (roomName: string, playerName:string) => void;
}
