import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

import {Game, Player} from '../shared/Game';
import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../shared/types';


// Serve static files from the "public" directory
app.use('/', express.static(path.resolve(path.join(__dirname, '/../../dist/'))));

// Route for the homepage
app.get('/', (req:Request, res:Response) => {
  res.sendFile('index.html');
});

const rooms: Record<string, Game> = {};

// Socket.IO connections
io.on('connection', (socket: Socket<
  ClientToServerEvents,
  ServerToClientEvents
>) => {
  socket.on('tryJoinGame', (roomName, playerName) => {
    if (rooms[roomName] === undefined) {
      socket.emit('roomDoesNotExist');
    } else if (rooms[roomName].playerExists(playerName)) {
      socket.emit('playerAlreadyExists');
    } else {
      socket.join(roomName);
      io.to(roomName)
        .emit('joinGame', roomName, rooms[roomName].getPlayerData());
    }
  });

  socket.on('createGame', (playerName) => {
    const game = new Game();
    const roomName = game.roomName;
    const firstPlayer = new Player(playerName, true);
    game.addPlayer(firstPlayer);
    rooms[roomName] = game;
    socket.join(roomName);
    io.to(roomName)
      .emit('gameCreated', roomName, rooms[roomName].getPlayerData());
  });

  socket.on('toggleReady', (roomName, playerName) => {
    rooms[roomName].readyPlayerToggle(playerName);
    io.to(roomName).emit(
      'newPlayerData',
      rooms[roomName].getPlayerData()
    );
  });

  // Handle socket events
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const port = 3000;
http.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});