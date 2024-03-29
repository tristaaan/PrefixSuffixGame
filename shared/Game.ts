import { randomString, randomArrayObject } from './util';
import { GameState } from './types';

import type { PlayerData, LastSubmission, GameData } from './types';

const BLANK = "____" as const;

export class Player {
  name: string = "";
  submission: string = "";
  lastSubmission: LastSubmission | null = null;
  score: number = 0;
  ready: boolean = false;
  isAdmin: boolean = false;
  socketId: string;
  active: boolean = false;

  constructor(name: string, socketId:string, isFirstPlayer:boolean = false) {
    this.name = name.toLocaleLowerCase().trim();
    this.isAdmin = isFirstPlayer;
    this.socketId = socketId;
    this.active = true;
  }

  changeSubmission(newVal:string) {
    if (newVal === Game.SKIP_WORD && this.submission !== Game.SKIP_WORD) {
      // a player with a submission cannot be skipped
      return;
    }
    this.submission = newVal;
    this.ready = true;
  }

  clearSubmission(previousStem:string, isSubmissionPrefix:boolean) {
    this.lastSubmission = {
      stem: previousStem.replace(BLANK, ''),
      submission: this.submission,
      isSubmissionPrefix: isSubmissionPrefix
    };
    this.submission = "";
  }

  incrementScore(val:number) {
    this.score += val;
  }

  get playerPublicInfo():PlayerData {
    return {
      name: this.name,
      score: this.score,
      ready: this.ready,
      isAdmin: this.isAdmin,
      lastSubmission: this.lastSubmission
    };
  }

  toggleReady(forceTrue:boolean) {
    if (forceTrue) {
      // in the case of skipping players, they can still unready
      this.ready = true;
    } else {
      this.ready = !this.ready;
    }
  }
}

export class Game {
  players: Player[] = [];
  roomName: string = ""
  round:number = 1;
  gameState:GameState = GameState.IDLE;
  currentWord: string = "";
  isSubmissionPrefix: boolean = false;
  prefixes :string[] = [];
  suffixes :string[] = [];

  static ROOM_NAME_LENGTH = 4;
  static SKIP_WORD = '_';

  constructor(prefixes: string[], suffixes: string[]) {
    this.roomName = randomString(Game.ROOM_NAME_LENGTH);
    this.prefixes = prefixes;
    this.suffixes = suffixes;
  }

  static initialGameData():GameData {
    return {
      gameState: GameState.IDLE,
      round: 0,
      currentWord: ''
    };
  }

  getGameData():GameData {
    return {
      round: this.round,
      gameState: this.gameState,
      currentWord: this.currentWord
    }
  }

  startIdlePhase() {
    this.unReadyPlayers();
    this.gameState = GameState.IDLE;
    this.newRound();
  }

  startWritingPhase() {
    this.unReadyPlayers();
    this.gameState = GameState.WRITING;
    this.currentWord = this.newWord();
  }

  newGame() {
    this.round = 0;
    for (const p of this.players) {
      p.score = 0;
    }
  }

  newRound() {
    this.round += 1;
    for (const p of this.players) {
      p.clearSubmission(this.currentWord, this.isSubmissionPrefix);
      p.ready = false;
    }
  }

  newWord():string {
    if (Math.random() > 0.5) {
      this.currentWord = `${BLANK}${randomArrayObject(this.suffixes)}`;
      this.isSubmissionPrefix = true;
    } else {
      this.currentWord = `${randomArrayObject(this.prefixes)}${BLANK}`;
      this.isSubmissionPrefix = false;
    }
    return this.currentWord;
  }

  playerExists(name:string) {
    return this.players.findIndex((p) => p.name === name.toLocaleLowerCase()) >= 0;
  }

  getPlayerData(): PlayerData[] {
    return this.players.map((p) => p.playerPublicInfo);
  }

  getGameAdmin(): Player | undefined {
    // ideally this shouldn't ever be able to be undefined?
    return this.players.find((p) => p.isAdmin);
  }

  addPlayer(player:Player) {
    this.players.push(player);
  }

  removePlayer(playerName:string) {
    const index = this.players.findIndex((p) => p.name === playerName.toLocaleLowerCase());
    const [player] = this.players.splice(index, 1);
    if (index >= 0) {
      if (player.isAdmin && this.players.length) {
        this.players[0].isAdmin = true;
      }
    }
  }

  removePlayerBySocketId(id:string) {
    const index = this.players.findIndex((p) => p.socketId === id);
    if (index >= 0) {
      // if a player is kicked and then disconnected a negative index could remove the last player in the list
      const [player] = this.players.splice(index, 1);
      if (player.isAdmin && this.players.length) {
        this.players[0].isAdmin = true;
      }
    }
  }

  allWordsSubmitted():boolean {
    return this.players.every((p) => p.submission.length > 0);
  }

  readyPlayerToggle(playerName:string, forceReady:boolean = false) {
    const lowerName = playerName.toLocaleLowerCase();
    const player = this.getPlayer(lowerName);
    if (player) {
      player.toggleReady(forceReady);
    } else {
      console.warn(`no player found with name '${lowerName}'`);
    }
  }

  allPlayersReady():boolean {
    return this.players.every((p) => p.ready);
  }

  unReadyPlayers() {
    for (const p of this.players) {
      p.ready = false;
    }
  }

  getPlayer(playerName:string): Player | undefined {
    return this.players.find((p) => p.name === playerName.toLocaleLowerCase());
  }

  scoreRound() {
    const wordCount: Record<string, number[]> = {};
    // enumerate word counts
    for (const [i, p] of this.players.entries()) {
      const word = p.submission;
      if (word === Game.SKIP_WORD) {
        continue;
      } else if (wordCount[word]) {
        wordCount[word].push(i);
      } else {
        wordCount[word] = [i];
      }
    }

    // count matches in the wordCount object, assign scores.
    for (const playerIndices of Object.values(wordCount)) {
      const count = playerIndices.length;
      if (count > 1) {
        let inc:number = 0;
        if (count === 2) {
          inc = 3;
        } else if (count > 2) {
          inc = 1;
        }
        for (const i of playerIndices) {
          this.players[i].score += inc;
        }
      }
    }
  }
}
