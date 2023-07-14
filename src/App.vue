<script setup lang="ts">
  import { ref } from 'vue';
  import type { Ref } from 'vue';
  import { io, Socket } from 'socket.io-client';

  import { MIN_NAME_LENGTH, MAX_NAME_LENGTH } from '../shared/util';
  import { GameState } from '../shared/types';
  import type {
    ServerToClientEvents,
    ClientToServerEvents,
    PlayerData,
    GameData
  } from '../shared/types';

  enum PageState {
    LOBBY = "lobby",
    GAME = "game"
  };

  let pageState = ref(PageState.LOBBY);
  let joinPlayerName = ref("");
  let joinRoomName = ref("");
  let newGamePlayerName = ref("");

  let playerName:Ref<string> = ref("");
  let currentRoomName:Ref<string> = ref("");
  let roomPlayers: Ref<PlayerData[]> = ref([]);
  let currentWord: Ref<string> = ref("");
  let wordSubmission: Ref<string> = ref("");
  let gameRound:Ref<number> = ref(1);
  let gameState:Ref<GameState> = ref(GameState.IDLE);
  let copyStatus:Ref<string> = ref('');

  let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  function joinGame() {
    socket = io();
    establishSocket(socket);
    socket.emit('tryJoinGame', joinRoomName.value, joinPlayerName.value);
  }

  function startNewGame() {
    socket = io();
    establishSocket(socket);
    socket.emit('createGame', newGamePlayerName.value);
  }

  function establishSocket(s:Socket<ServerToClientEvents, ClientToServerEvents>) {
    s.on("roomDoesNotExist", () => {
      alert(`The room '${joinRoomName.value}' does not exists`);
    });

    s.on("playerAlreadyExists", () => {
      alert(`A player in that room already has the username ${joinPlayerName.value}`);
    });

    s.on('invalidPlayerName', () => {
      alert(`Player name must be between ${MIN_NAME_LENGTH} to ${MAX_NAME_LENGTH} characters in length`)
    });

    s.on("gameCreated", (roomName:string, playerData: PlayerData[]) => {
      currentRoomName.value = roomName;
      updatePlayerData(playerData);
      playerName.value = newGamePlayerName.value.toLocaleLowerCase();
      pageState.value = PageState.GAME;
    });

    s.on("joinGame", (roomName:string, playerData: PlayerData[]) => {
      currentRoomName.value = roomName;
      updatePlayerData(playerData);
      playerName.value = joinPlayerName.value.toLocaleLowerCase();
      pageState.value = PageState.GAME;
    });

    s.on('updateGameData', (playerData: PlayerData[], gameData:GameData) => {
      updatePlayerData(playerData);
      gameRound.value = gameData.round;
      gameState.value = gameData.gameState;
    });

    s.on('newWord', (newWord:string, playerData: PlayerData[], gameData:GameData) => {
      currentWord.value = newWord;
      updatePlayerData(playerData);
      gameState.value = gameData.gameState;
      wordSubmission.value = "";
    });
  }

  function updatePlayerData(playerData: PlayerData[]) {
    roomPlayers.value = [];
    for (const d of playerData) {
      roomPlayers.value.push(d);
    }
  }

  function toggleReady() {
    socket.emit('toggleReady', currentRoomName.value, playerName.value);
  }

  function submitWord() {
    socket.emit(
      'submitWord',
      currentRoomName.value,
      playerName.value,
      wordSubmission.value.toLowerCase()
    );
  }

  function copyRoomName() {
    navigator.clipboard.writeText(currentRoomName.value)
      .then(() => {
        copyStatus.value = "✅";
        setTimeout(() => {
          copyStatus.value = '';
        }, 3000);
      });
  }

</script>

<template>
  <main v-if="pageState == PageState.LOBBY">
    <h2>Join Game</h2>
    <label>
      Room ID
      <input type="text" v-model.trim="joinRoomName">
    </label>
    <label>
      Player Name
      <input type="text" v-model.trim="joinPlayerName">
    </label>
    <button
      @click="joinGame"
      :disabled="joinRoomName.length === 0 || joinPlayerName.length === 0"
    >
      Join
    </button>
    <br>

    <h2>Start New Game</h2>
    <label>
      Player Name
      <input type="text" v-model.trim="newGamePlayerName">
    </label>
    <button
      @click="startNewGame"
      :disabled="newGamePlayerName.length === 0"
    >
      Start New Game
    </button>
  </main>

  <main v-if="pageState == PageState.GAME">
    <h1>
      Room Name: {{ currentRoomName }}
    </h1>
    <button @click="copyRoomName">Copy Room Name {{ copyStatus }}</button>
    <h2>Round: {{ gameRound }}</h2>
    <h2>Players</h2>
    <table>
      <thead>
        <tr>
          <th>Admin</th>
          <th>Name</th>
          <th>Score</th>
          <th v-if="gameRound > 1">Last word</th>
          <th>Ready</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in roomPlayers" :key="p.name" >
          <td>{{ p.isAdmin ? '➡️' : '' }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.score }}</td>
          <td v-if="gameRound > 1 && p.lastSubmission">
            <span v-if="p.lastSubmission.isSubmissionPrefix">
              <span class="last-submission">{{ p.lastSubmission.submission }}</span>
              <span>{{ p.lastSubmission.stem }}</span>
            </span>
            <span v-else>
              <span>{{ p.lastSubmission.stem }}</span>
              <span class="last-submission">{{ p.lastSubmission.submission }}</span>
            </span>
          </td>
          <td v-if="gameRound > 1 && !p.lastSubmission"/>
          <td>{{ p.ready ? '✅' : '_' }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="gameState === GameState.IDLE">
      <button @click="toggleReady">Ready</button>
    </div>
    <div v-if="gameState === GameState.WRITING">
      <h1>{{ currentWord }}</h1>
      <input type="text" v-model.trim="wordSubmission">
      <button
        @click="submitWord"
        :disabled="wordSubmission.length === 0">Submit</button>
    </div>
  </main>
  <footer>
    <h2>Rules:</h2>
    <ol>
      <li>A word is shown to players with a blank space either before or after. (e.g., <em>___ball</em> or <em>up___</em>)</li>
      <li>Players submit a word or fragment that fits in that space. (e.g., <em>foot</em> for <em>___ball</em>  or <em>draft</em> for <em>up___</em>)</li>
      <li>
        Once all players have made submissions players are assigned points based on the following:
        <ul>
          <li>If a pair of players have the same word they both get 3 points.</li>
          <li>If more than two players have the same word everyone gets 1 point.</li>
          <li>If no words match no players get any points.</li>
        </ul>
      </li>
      <li>
        Repeat for as long as you want.
      </li>
    </ol>
  </footer>
</template>

<style scoped>
  .last-submission{
    text-decoration: underline;
  }

  tr td, tr th {
    padding: 3px 25px;
    border-bottom: 1px solid #bfbfbf;
    border-right: 1px solid #bfbfbf;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr th:last-child,
  tr td:last-child {
    border-right: none;
  }

  table {
    border-collapse: collapse;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    cursor:not-allowed;
  }
</style>
