import { createApp } from 'vue'
import { Game } from '../shared/Game';
import App from './App.vue'

const roomName = location.pathname.split('/')[1] ?? null;
const roomRegex = new RegExp(`^[A-Z0-9]{${Game.ROOM_NAME_LENGTH}}$`);
const initialData: Record<string, string> = {};
if (roomName && roomRegex.test(roomName)) {
  initialData.initialRoomName = roomName;
}

createApp(App, { ...initialData })
  .mount('#app')
