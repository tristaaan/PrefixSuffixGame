<script setup lang="ts">
  import { ref, Ref } from 'vue'
  import { io, Socket } from 'socket.io-client';

  import type { ServerToClientEvents, ClientToServerEvents, PlayerData } from '../shared/types';

  enum PageState {
    LOBBY = "lobby",
    GAME = "game"
  };

  // enum GameState {
  //   WRITING = "WRITING",
  //   SCORING = "SCORING",
  // };

  let pageState = ref(PageState.LOBBY);
  let joinPlayerName = ref("");
  let joinRoomName = ref("");
  let newGamePlayerName = ref("");

  let playerName:Ref<string> = ref("");
  let currentRoomName:Ref<string> = ref("");
  let roomPlayers: Ref<PlayerData> = ref([]);
  let currentWord: Ref<string> = ref("");
  let wordSubmission: Ref<string> = ref("");

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

    s.on("gameCreated", (roomName:string, playerData: PlayerData) => {
      currentRoomName.value = roomName;
      updatePlayerData(playerData);
      playerName.value = newGamePlayerName.value;
      pageState.value = PageState.GAME;
    });

    s.on("joinGame", (roomName:string, playerData: PlayerData) => {
      currentRoomName.value = roomName;
      updatePlayerData(playerData);
      playerName.value = joinPlayerName.value;
      pageState.value = PageState.GAME;
    });

    s.on('newPlayerData', (playerData:PlayerData) => {
      updatePlayerData(playerData);
    });

    s.on('newWord', (newWord:string) => {
      currentWord.value = newWord;
    });
  }

  function updatePlayerData(playerData: PlayerData) {
    roomPlayers.value = [];
    for (const d of playerData) {
      roomPlayers.value.push(d);
    }
  }

  function toggleReady() {
    socket.emit('toggleReady', currentRoomName.value, playerName.value);
  }

  function submitWord() {
    socket.emit('submitWord', wordSubmission.value, playerName.value);
  }

</script>

<template>
  <main v-if="pageState == PageState.LOBBY">
    <h2>Join Game</h2>
    <label>
      Room ID
      <input type="text" v-model="joinRoomName">
    </label>
    <label>
      Player Name
      <input type="text" v-model="joinPlayerName">
    </label>
    <button @click="joinGame">JOIN</button>
    <br>

    <h2>Start New Game</h2>
    <label>
      Player Name
      <input type="text" v-model="newGamePlayerName">
    </label>
    <button @click="startNewGame">Start New Game</button>
  </main>

  <main v-if="pageState == PageState.GAME">
    <h1>Room Name: {{ currentRoomName }}</h1>
    <h2>Players</h2>
    <table>
      <th><td>Name</td><td>Score</td><td>Ready</td></th>
      <tr v-for="p in roomPlayers" :key="p.name" >
        <td>{{ p.name }}</td>
        <td>{{ p.score }}</td>
        <td>{{ p.ready ? '✅' : '_' }}</td>
      </tr>
    </table>
    <button @click="toggleReady">Ready</button>
    <h1>{{ currentWord }}</h1>
    <div v-if="currentWord.length">
      <input type="text" v-model="wordSubmission">
      <button @click="submitWord">Submit</button>
    </div>
  </main>
</template>

<style scoped>

</style>
