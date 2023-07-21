<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import type { Ref, ComputedRef } from 'vue';
  import { io, Socket } from 'socket.io-client';
  import QRCode from 'qrcode';

  import { MIN_NAME_LENGTH, MAX_NAME_LENGTH } from '../shared/util';
  import { GameState } from '../shared/types';
  import { showNotification } from './util/Notifications';
  import type {
    ServerToClientEvents,
    ClientToServerEvents,
    PlayerData,
    GameData
  } from '../shared/types';
  import { Game } from '../shared/Game';
  import ScoreCard from './components/ScoreCard.vue';

  enum PageState {
    LOBBY = "lobby",
    GAME = "game"
  };

  const props = defineProps<{
    initialRoomName: string
  }>()

  const pageState = ref(PageState.LOBBY);
  const currentRoomName:Ref<string> = ref(props.initialRoomName ?? "");
  const joinPlayerName = ref("");
  const joinRoomName = ref(currentRoomName);
  const newGamePlayerName = ref("");

  const playerName:Ref<string> = ref("");
  const roomPlayers: Ref<PlayerData[]> = ref([]);
  const wordSubmission: Ref<string> = ref("");
  const gameData: Ref<GameData> = ref(Game.initialGameData());
  const copyStatus:Ref<string> = ref('');
  const src = ref("");
  const currentPlayerIsAdmin: ComputedRef<boolean> = computed(() => {
    const player = roomPlayers.value.find((p) => p.name === playerName.value);
    if (player) {
      return player.isAdmin;
    }
    return false
  });
  let isInGame: ComputedRef<boolean> = computed(() => pageState.value === PageState.GAME);
  watch(isInGame, (newVal, _oldVal) => {
    if (newVal) {
      const code = `${location.origin}/${currentRoomName.value}`;
      console.log(code);
      QRCode.toDataURL(code, { margin: 1 }, (err:Error, url:string) => {
        if (err) {
          console.error(err);
        } else {
          src.value = url;
        }
      })
    } else {
      console.log('not new val?');
    }
  });

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
      alert(`The room '${joinRoomName.value}' does not exist, this link may be expired`);
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

    s.on('updateGameData', (playerData: PlayerData[], _gameData:GameData, kickedPlayer?:string) => {
      // show notification on round complete
      if (_gameData.round !== gameData.value.round) {
        const oldPlayerScore = roomPlayers.value.find((p) => p.name === playerName.value)?.score ?? 0;
        const newPlayerScore = playerData.find((p) => p.name === playerName.value)?.score ?? 0;
        if (oldPlayerScore !== newPlayerScore) {
          showNotification('Wordfix', `You got ${newPlayerScore - oldPlayerScore} points for "${wordSubmission.value}"!`);
        } else {
          showNotification('Wordfix', `You got zero points for "${wordSubmission.value}" :(`);
        }
      }
      updatePlayerData(playerData);
      gameData.value = _gameData;
      if (kickedPlayer && kickedPlayer === playerName.value) {
        s.disconnect();
        pageState.value = PageState.LOBBY;
      }
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

  function adminSkip(e:Event) {
    const skippedPlayer = (e.target as HTMLElement).dataset.playerName;
    if (skippedPlayer) {
      socket.emit(
        'skipPlayer',
        currentRoomName.value,
        skippedPlayer
      );
    }
  }

  function adminKick (e:Event) {
    const kickedPlayer = (e.target as HTMLElement).dataset.playerName;
    if (kickedPlayer && confirm(`Are you sure you want to kick ${kickedPlayer}?`)) {
      socket.emit(
        'kickPlayer',
        currentRoomName.value,
        kickedPlayer
      );
    }
  }

</script>

<template>
  <main class="lobby" v-if="!isInGame">
    <h2>Join Game</h2>
    <label>
      Room ID
      <input type="text"
        v-model.trim="joinRoomName"
        :maxlength="Game.ROOM_NAME_LENGTH"
        placeholder="four character code"
      >
    </label>
    <label>
      Player Name
      <input type="text"
        v-model.trim="joinPlayerName"
        placeholder="what people call you"
      >
    </label>
    <button
      @click="joinGame"
      :disabled="joinRoomName.length === 0 || joinPlayerName.length === 0"
    >
      Join
    </button>
    <br>
    <div v-if="currentRoomName.length == 0">
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
    </div>
  </main>

  <main v-else>
    <h1>
      Room Name: {{ currentRoomName }}
    </h1>
    <button @click="copyRoomName">Copy Room Name {{ copyStatus }}</button>
    <h2>Round: {{ gameData.round }}</h2>
    <h2>Players</h2>
    <table>
      <thead>
        <tr>
          <th v-if="currentPlayerIsAdmin">Admin</th>
          <th>Ready</th>
          <th>Name</th>
          <th>Score</th>
          <th v-if="(gameData.round ?? 0) > 1">Last word</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in roomPlayers" :key="p.name" >
          <td v-if="currentPlayerIsAdmin">
            <span v-if="p.isAdmin">➡️</span>
            <span v-else>
              <button @click="adminSkip" :data-player-name="p.name">skip</button>
              <button @click="adminKick" :data-player-name="p.name">kick</button>
            </span>
          </td>
          <td>{{ p.ready ? '✅' : '_' }}</td>
          <td>{{ p.name }}</td>
          <td>
            <ScoreCard :score="p.score"/>
          </td>
          <td v-if="gameData.round > 1 && p.lastSubmission">
            <span v-if="p.lastSubmission.isSubmissionPrefix">
              <span class="last-submission">{{ p.lastSubmission.submission }}</span>
              <span>{{ p.lastSubmission.stem }}</span>
            </span>
            <span v-else>
              <span>{{ p.lastSubmission.stem }}</span>
              <span class="last-submission">{{ p.lastSubmission.submission }}</span>
            </span>
          </td>
          <td v-if="gameData.round > 1 && !p.lastSubmission"/>
        </tr>
      </tbody>
    </table>
    <div v-if="gameData.gameState === GameState.IDLE">
      <button @click="toggleReady">Ready</button>
    </div>
    <div v-if="gameData.gameState === GameState.WRITING">
      <h1>{{ gameData.currentWord }}</h1>
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
    <div class="qr-code" v-show="isInGame">
      <h3>Invite others!</h3>
      <img :src="src" />
    </div>
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

  .lobby label, .lobby button {
    margin-top: 6px;
    display: block;
  }

  .qr-code h3 {
    margin-bottom: 0;
  }

</style>
