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
    s.on("gameCreated", (roomName:string, playerData: PlayerData) => {
      currentRoomName.value = roomName;
      updatePlayerData(playerData);
      playerName.value = newGamePlayerName.value;
      pageState.value = PageState.GAME;
    });

    s.on("joinGame", (roomName:string, playerData: PlayerData) => {
      currentRoomName.value = roomName;
      updatePlayerData(playerData);
      pageState.value = PageState.GAME;
    });

    s.on('newPlayerData', (playerData:PlayerData) => {
      console.log(playerData);
      updatePlayerData(playerData);
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
    <h1>{{ currentRoomName }}</h1>
    <h2>Players</h2>
    <ul>
      <li v-for="p in roomPlayers" :key="p.name" >
        {{ p.name }}: {{ p.score }} {{ p.ready ? '✅' : '_' }}
      </li>
    </ul>
    <button @click="toggleReady">Ready</button>
  </main>
</template>

<style scoped>

</style>
