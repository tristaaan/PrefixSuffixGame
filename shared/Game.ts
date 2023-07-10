const { randomString } = require('./util');

export class Player {
  name: string = "";
  submission: string = "";
  score: number = 0;
  ready: boolean = false;
  isAdmin: boolean = false;
  constructor(name: string, isFirstPlayer:boolean = false) {
    this.name = name;
    this.isAdmin = isFirstPlayer;
  }

  changeSubmission(newVal:string) {
    this.submission = newVal;
  }

  clearSubmission() {
    this.submission = "";
  }

  incrementScore(val:number) {
    this.score += val;
  }

  get playerPublicInfo() {
    return {
      name: this.name,
      score: this.score,
      ready: this.ready,
      isAdmin: this.isAdmin
    };
  }

  toggleReady() {
    this.ready = !this.ready;
  }
}

export class Game {
  players: Player[] = [];
  roomName: string = ""
  round:number = 0;
  constructor() {
    this.roomName = randomString(6);
  }

  newGame() {
    this.round = 0;
    for (const p of this.players) {
      p.score = 0;
    }
  }

  playerExists(name:string) {
    return this.players.findIndex((p) => p.name === name) >= 0;
  }

  getPlayerData() {
    return this.players.map((p) => p.playerPublicInfo);
  }

  addPlayer(player:Player) {
    this.players.push(player);
  }

  removePlayer(playerName:string) {
    const index = this.players.findIndex((p) => p.name === playerName);
    this.players.splice(index, 1);
  }

  readyPlayerToggle(playerName:string) {
    const player = this.getPlayer(playerName);
    if (player) {
      player.toggleReady();
    } else {
      console.warn(`no player found with name '${playerName}'`);
    }
  }

  getPlayer(playerName:string): Player | undefined {
    return this.players.find((p) => p.name === playerName);
  }

  scoreRound() {
    const wordCount: {[word: string]: number[]} = {};
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
