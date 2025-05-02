import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// Game rooms storage
const games = new Map();
// Track socket connections by device ID
const connectedDevices = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle creating a new game
  socket.on('create_game', ({ gameId, nickname, deviceId }) => {
    console.log(`Game created: ${gameId} by ${nickname} (device: ${deviceId})`);
    
    // Store this socket's device ID
    socket.data.deviceId = deviceId;
    socket.data.nickname = nickname;
    socket.data.gameId = gameId;
    
    // Map device ID to this connection
    connectedDevices.set(deviceId, {
      socketId: socket.id,
      nickname,
      gameId
    });
    
    // Create a new game instance
    games.set(gameId, {
      id: gameId,
      players: [{nickname, deviceId}],  // Store player with device ID
      chess: new Chess(),
      started: false,
      moves: []
    });
    
    // Join the socket to the game room
    socket.join(gameId);
    
    // Notify everyone in the room about the player
    io.to(gameId).emit('player_joined', { 
      players: games.get(gameId).players.map(p => p.nickname) 
    });
  });
  
  // Handle joining an existing game
  socket.on('join_game', ({ gameId, nickname, deviceId }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    // Check if this device is already in the game
    const deviceAlreadyInGame = game.players.some(p => p.deviceId === deviceId);
    
    if (game.players.length >= 2 && !deviceAlreadyInGame) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    // Store this socket's info
    socket.data.deviceId = deviceId;
    socket.data.nickname = nickname;
    socket.data.gameId = gameId;
    
    // Map device ID to this connection
    connectedDevices.set(deviceId, {
      socketId: socket.id,
      nickname,
      gameId
    });
    
    console.log(`Player ${nickname} (device: ${deviceId}) joined game ${gameId}`);
    
    // Only add the player if their device isn't already in the game
    if (!deviceAlreadyInGame) {
      // Add player to the game
      game.players.push({nickname, deviceId});
    }
    
    // Join the socket to the game room
    socket.join(gameId);
    
    // Notify everyone in the room about the players
    io.to(gameId).emit('player_joined', { 
      players: game.players.map(p => p.nickname) 
    });
  });
  
  // Handle starting a game
  socket.on('start_game', ({ gameId }) => {
    const game = games.get(gameId);
    
    if (!game) return;
    
    // We need at least 2 unique devices to start a game
    const uniqueDeviceCount = new Set(game.players.map(p => p.deviceId)).size;
    if (uniqueDeviceCount < 2) {
      socket.emit('error', { message: 'Need two different players to start the game' });
      return;
    }
    
    console.log(`Game ${gameId} started`);
    
    game.started = true;
    
    // Notify all players that the game has started
    io.to(gameId).emit('game_start');
  });
  
  // Handle a chess move
  socket.on('make_move', ({ gameId, move, player, deviceId, notation }) => {
    const game = games.get(gameId);
    
    if (!game || !game.started) return;
    
    try {
      // Apply move to the server's chess instance
      const result = game.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      
      // Store move with notation and device ID
      game.moves.push({
        notation: notation || result.san,
        player,
        deviceId
      });
      
      // Broadcast the move to all players in the game
      io.to(gameId).emit('game_move', { 
        move,
        notation: notation || result.san,
        fen: game.chess.fen()
      });
      
      // Check for game over conditions
      if (game.chess.isCheckmate()) {
        io.to(gameId).emit('game_over', { 
          result: `${game.chess.turn() === 'w' ? 'Black' : 'White'} wins`,
          reason: 'Checkmate'
        });
      } else if (game.chess.isDraw()) {
        io.to(gameId).emit('game_over', { 
          result: 'Draw',
          reason: game.chess.isStalemate() ? 'Stalemate' : 
                 game.chess.isInsufficientMaterial() ? 'Insufficient material' :
                 game.chess.isThreefoldRepetition() ? 'Threefold repetition' : 'Fifty-move rule'
        });
      }
      
    } catch (error) {
      console.error('Invalid move:', error);
    }
  });
  
  // Handle chat messages
  socket.on('send_message', (messageData) => {
    const { gameId } = messageData;
    
    if (!games.has(gameId)) return;
    
    // Broadcast the message to all players in the game except the sender
    socket.to(gameId).emit('chat_message', messageData);
  });
  
  // Handle player leaving
  socket.on('leave_game', ({ gameId, nickname, deviceId }) => {
    leaveGame(socket, gameId, nickname, deviceId);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Get the device ID associated with this socket
    const deviceId = socket.data.deviceId;
    
    if (deviceId) {
      const deviceInfo = connectedDevices.get(deviceId);
      if (deviceInfo) {
        leaveGame(socket, deviceInfo.gameId, deviceInfo.nickname, deviceId);
        // Remove device from connected devices
        connectedDevices.delete(deviceId);
      }
    }
  });
  
  // Helper function for leaving a game
  function leaveGame(socket, gameId, nickname, deviceId) {
    const game = games.get(gameId);
    if (!game) return;
    
    console.log(`Player ${nickname} (device: ${deviceId}) left game ${gameId}`);
    
    // Remove player from the game
    const playerIndex = game.players.findIndex(p => p.deviceId === deviceId);
    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1);
      
      // If there are still players in the game
      if (game.players.length > 0) {
        // Notify remaining players
        io.to(gameId).emit('player_left', { 
          player: nickname, 
          players: game.players.map(p => p.nickname)
        });
        
        // If the game had already started, end it
        if (game.started) {
          io.to(gameId).emit('game_over', { 
            result: `${nickname} resigned`,
            reason: 'Player left the game'
          });
        }
      } else {
        // If no players left, remove the game
        games.delete(gameId);
      }
    }
    
    // Leave the socket room
    socket.leave(gameId);
  }
});

// All other GET requests not handled will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});