import { randomString, randomArrayObject } from './util';
import { GameState } from './types';

import type { PlayerData, LastSubmission } from './types';

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
    this.name = name;
    this.isAdmin = isFirstPlayer;
    this.socketId = socketId;
    this.active = true;
  }

  changeSubmission(newVal:string) {
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

  toggleReady() {
    this.ready = !this.ready;
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

  constructor(prefixes: string[], suffixes: string[]) {
    this.roomName = randomString(6);
    this.prefixes = prefixes;
    this.suffixes = suffixes;
  }

  getGameData() {
    return { round: this.round, gameState: this.gameState}
  }

  startIdlePhase() {
    this.unReadyPlayers();
    this.gameState = GameState.IDLE;
    this.newRound();
  }

  startWritingPhase() {
    this.unReadyPlayers();
    this.gameState = GameState.WRITING;
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
    return this.players.findIndex((p) => p.name === name) >= 0;
  }

  getPlayerData(): PlayerData[] {
    return this.players.map((p) => p.playerPublicInfo);
  }

  addPlayer(player:Player) {
    this.players.push(player);
  }

  removePlayer(playerName:string) {
    const index = this.players.findIndex((p) => p.name === playerName);
    const [player] = this.players.splice(index, 1);
    if (player.isAdmin && this.players.length) {
      this.players[0].isAdmin = true;
    }
  }

  removePlayerBySocketId(id:string) {
    const index = this.players.findIndex((p) => p.socketId === id);
    const [player] = this.players.splice(index, 1);
    if (player.isAdmin && this.players.length) {
      this.players[0].isAdmin = true;
    }
  }

  allWordsSubmitted():boolean {
    return this.players.every((p) => p.submission.length > 0);
  }

  readyPlayerToggle(playerName:string) {
    const player = this.getPlayer(playerName);
    if (player) {
      player.toggleReady();
    } else {
      console.warn(`no player found with name '${playerName}'`);
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
    return this.players.find((p) => p.name === playerName);
  }

  scoreRound() {
    const wordCount: Record<string, number[]> = {};
    // enumerate word counts
    for (const [i, p] of this.players.entries()) {
      const word = p.submission;
      if (wordCount[word]) {
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
