<script setup lang="ts">
import { ref } from 'vue';
import { Game } from '../../shared/Game';

const emit = defineEmits<{
  'on-join-game': [roomName: string, playerName: string]
  'on-start-game': [playerName: string]
}>();

const props = defineProps<{
  initialRoomName?: string
}>();

const joinPlayerNameInput = ref<HTMLDivElement>();
const joinPlayerName = ref("");
const joinRoomName = ref(props.initialRoomName ?? "");

const newGamePlayerName = ref("");

const emitOnStartGame = () => {
  if (newGamePlayerName.value) {
    emit('on-start-game', newGamePlayerName.value);
  }
}

const emitOnJoinGame = () => {
  if (joinRoomName.value && joinPlayerName.value) {
    emit('on-join-game', joinRoomName.value, joinPlayerName.value);
  }
}

</script>

<template>
  <main class="lobby">
    <h2>Join Game</h2>
    <label>
      Room ID
      <input type="text"
        v-model.trim="joinRoomName"
        :maxlength="Game.ROOM_NAME_LENGTH"
        @keyup.enter="joinRoomName ? joinPlayerNameInput?.focus() : null"
        autocomplete="off"
        placeholder="four character code"
        enterkeyhint="next"
      >
    </label>
    <label>
      Player Name
      <input type="text"
        ref="joinPlayerNameInput"
        v-model.trim="joinPlayerName"
        @keyup.enter="emitOnJoinGame"
        autocomplete="off"
        placeholder="what people call you"
        enterkeyhint="go"
      >
    </label>
    <button
      @click="emitOnJoinGame"
      :disabled="joinRoomName.length === 0 || joinPlayerName.length === 0"
      >
      Join
    </button>
    <br>
    <div v-if="!props.initialRoomName">
      <h2>Start New Game</h2>
      <label>
        Player Name
        <input type="text"
          v-model.trim="newGamePlayerName"
          @keyup.enter="emitOnStartGame"
          autocomplete="off"
          enterkeyhint="go"
        >
      </label>
      <button
        @click="emitOnStartGame"
        :disabled="newGamePlayerName.length === 0"
      >
        Start New Game
      </button>
    </div>
  </main>
</template>

<style scoped>
  main h2 {
    margin-top: 0.5em;
  }

  .lobby label, .lobby button {
    margin-top: 6px;
    display: block;
  }

  input {
    font-size: 1rem;
  }

  @media screen and (max-width: 400px) {
  }
</style>
