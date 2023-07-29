import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

import {Game, Player} from '../shared/Game';
import { validPlayerName } from '../shared/util';
import readWords from './readWords';
import type { Socket } from 'socket.io';
import { type ServerToClientEvents, type ClientToServerEvents, GameState } from '../shared/types';


// Serve static files from the "public" directory
const rootpath = path.join('./dist');
app.use('/', express.static(rootpath));

// Route for the homepage
app.get('/*', (req:Request, res:Response) => {
  res.sendFile('index.html', { root : rootpath});
});

const rooms: Record<string, Game> = {};
const socketIdByRoom: Record<string, string> = {};

const suffixes = readWords('suffixes.txt');
const prefixes = readWords('prefixes.txt');

function playerIsAdmin(socketId: string, game:Game):boolean {
  return game.getGameAdmin()?.socketId === socketId;
}

// Socket.IO connections
io.on('connection', (socket: Socket<
  ClientToServerEvents,
  ServerToClientEvents
>) => {
  socket.on('tryJoinGame', (roomName, playerName) => {
    roomName = roomName.toUpperCase();
    if (rooms[roomName] === undefined) {
      socket.emit('roomDoesNotExist', roomName);
    } else if (rooms[roomName].playerExists(playerName)) {
      socket.emit('playerAlreadyExists', playerName);
    } else if (!validPlayerName(playerName)) {
      socket.emit('invalidPlayerName');
    } else {
      const game = rooms[roomName];
      const newPlayer = new Player(playerName, socket.id);
      game.addPlayer(newPlayer);
      socket.emit('joinGame', roomName, newPlayer.name, game.getPlayerData())
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
      .emit('gameCreated', roomName, firstPlayer.name, rooms[roomName].getPlayerData());
    socketIdByRoom[socket.id] = roomName;
  });

  socket.on('toggleReady', (roomName, playerName) => {
    const game = rooms[roomName];
    game.readyPlayerToggle(playerName);
    if (game.allPlayersReady()) {
      game.startWritingPhase();
    }
    io.to(roomName).emit(
      'updateGameData',
      game.getPlayerData(),
      game.getGameData()
    );
  });

  socket.on('submitWord', (roomName, playerName, word) => {
    const game = rooms[roomName];
    const player = game.getPlayer(playerName);
    if (player) {
      player.changeSubmission(word);
      if (game.allWordsSubmitted()) {
        game.scoreRound();
        game.startIdlePhase();
      }
      io.to(roomName)
        .emit('updateGameData',
          game.getPlayerData(),
          game.getGameData()
        );
    }
  });

  socket.on('kickPlayer', (roomName, playerName) => {
    // assert admin
    const game = rooms[roomName];
    if (playerIsAdmin(socket.id, game)) {
      game.removePlayer(playerName);
      io.to(roomName)
        .emit('updateGameData',
          game.getPlayerData(),
          game.getGameData(),
          playerName
        );
    }
  })

  socket.on('skipPlayer', (roomName, skippedPlayer) => {
    const game = rooms[roomName];
    if (playerIsAdmin(socket.id, game)) {
      if (game.gameState === GameState.IDLE) {
        // ready up a player, they can unready if necessary
        game.readyPlayerToggle(skippedPlayer, true);
        if (game.allPlayersReady()) {
          game.startWritingPhase();
        }
      } else if (game.gameState === GameState.WRITING) {
        // change skipped player submission to skipped word
        const player = game.getPlayer(skippedPlayer);
        player?.changeSubmission(Game.SKIP_WORD);
        if (game.allWordsSubmitted()) {
          game.scoreRound();
          game.startIdlePhase();
        }
      }
      io.to(roomName)
        .emit('updateGameData',
          game.getPlayerData(),
          game.getGameData()
        );
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`player dc: '${reason}'`);
    const roomName = socketIdByRoom[socket.id];
    const game = rooms[roomName];
    if (game) {
      game.removePlayerBySocketId(socket.id);
      if (game.players.length === 0) {
        // clear room
        delete rooms[roomName];
        console.log(`game finished: ${game.roomName}`);
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
