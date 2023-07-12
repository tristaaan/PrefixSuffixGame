import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

import {Game, Player} from '../shared/Game';
import readWords from './readWords';
import type { Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../shared/types';


// Serve static files from the "public" directory
app.use('/', express.static(path.resolve(path.join(__dirname, '/../../dist/'))));

// Route for the homepage
app.get('/', (req:Request, res:Response) => {
  res.sendFile('index.html');
});

const rooms: Record<string, Game> = {};
const socketIdByRoom: Record<string, string> = {};

const suffixes = readWords('suffixes.txt');
const prefixes = readWords('prefixes.txt');

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
      const game = rooms[roomName];
      const newPlayer = new Player(playerName, socket.id);
      game.addPlayer(newPlayer);
      socket.emit('joinGame', roomName, game.getPlayerData())
      socket.join(roomName);
      io.to(roomName)
        .emit('updateGameData',
          game.getPlayerData(),
          game.getGameData()
        );
      socketIdByRoom[socket.id] = roomName;
    }
  });

  socket.on('createGame', (playerName) => {
    const game = new Game(prefixes, suffixes);
    const roomName = game.roomName;
    const firstPlayer = new Player(playerName, socket.id, true);
    game.addPlayer(firstPlayer);
    rooms[roomName] = game;
    socket.join(roomName);
    io.to(roomName)
      .emit('gameCreated', roomName, rooms[roomName].getPlayerData());
    socketIdByRoom[socket.id] = roomName;
  });

  socket.on('toggleReady', (roomName, playerName) => {
    const game = rooms[roomName];
    game.readyPlayerToggle(playerName);
    io.to(roomName).emit(
      'updateGameData',
      game.getPlayerData(),
      game.getGameData()
    );
    if (game.allPlayersReady()) {
      game.startWritingPhase()
      io.to(roomName).emit(
        'newWord',
        game.newWord(),
        game.getPlayerData(),
        game.getGameData()
      );
    }
  });

  socket.on('submitWord', (roomName, playerName, word) => {
    const game = rooms[roomName];
    const player = game.getPlayer(playerName);
    if (player) {
      player.changeSubmission(word);
      if (game.allWordsSubmitted()) {
        game.scoreRound();
        game.startIdlePhase();
        io.to(roomName)
          .emit('updateGameData',
            game.getPlayerData(),
            game.getGameData()
          );
      }
    }
  });

  // Handle socket events
  socket.on('disconnect', () => {
    const roomName = socketIdByRoom[socket.id];
    const game = rooms[roomName];
    if (game) {
      game.removePlayerBySocketId(socket.id);

      if (game.players.length === 0) {
        // clear room
        delete rooms[roomName];
      } else {
        // otherwise send update to the room with new player data
        io.to(roomName)
          .emit('updateGameData',
            game.getPlayerData(),
            game.getGameData()
          );
      }
    }

  });
});

// Start the server
const port = 3000;
http.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
