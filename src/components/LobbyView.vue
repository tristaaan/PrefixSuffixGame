<script setup lang="ts">
import { ref } from 'vue';
import { Game } from '../../shared/Game';

defineEmits<{
  'on-join-game': [roomName: string, playerName: string]
  'on-start-game': [playerName: string]
}>();

const props = defineProps<{
  initialRoomName?: string
}>();

const joinPlayerName = ref("");
const joinRoomName = ref(props.initialRoomName ?? "");

const newGamePlayerName = ref("");

</script>

<template>
  <main class="lobby">
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
      @click="$emit('on-join-game', joinRoomName, joinPlayerName)"
      :disabled="joinRoomName.length === 0 || joinPlayerName.length === 0"
      >
      Join
    </button>
    <br>
    <div v-if="!props.initialRoomName">
      <h2>Start New Game</h2>
      <label>
        Player Name
        <input type="text" v-model.trim="newGamePlayerName">
      </label>
      <button
        @click="$emit('on-start-game', newGamePlayerName)"
        :disabled="newGamePlayerName.length === 0"
      >
        Start New Game
      </button>
    </div>
  </main>
</template>

<style>
</style>