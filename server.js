import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';
import fs from 'fs';

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

// Check if dist directory exists - if not, we're likely in development mode
const distPath = path.join(__dirname, 'dist');
const inDevelopmentMode = !fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'));

if (!inDevelopmentMode) {
  // Serve static files from the React build in production
  console.log('Running in production mode - serving static files from dist');
  app.use(express.static(distPath));
} else {
  // In development mode - redirect to dev server or show a helpful message
  console.log('Running in development mode - no dist folder detected');
  app.get('/', (req, res) => {
    res.send(`
      <h1>Chess Multiplayer Server Running</h1>
      <p>This is the WebSocket server running on port 3001.</p>
      <p>In development mode, access your application at: <a href="http://localhost:3000">http://localhost:3000</a></p>
      <p>If you intended to run in production mode, build your app with 'npm run build' first.</p>
    `);
  });
}

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
      players: [{nickname, deviceId, socketId: socket.id}],  // Store player with device ID and socket ID
      chess: new Chess(),
      started: false,
      readyPlayers: [],
      moves: []
    });
    
    // Join the socket to the game room
    socket.join(gameId);
    
    // Notify everyone in the room about the player
    io.to(gameId).emit('player_joined', { 
      players: games.get(gameId).players.map(p => p.nickname) 
    });
  });
  
  // Handle player ready status
  socket.on('player_ready', ({ gameId, nickname, deviceId, ready }) => {
    console.log(`Player ${nickname} (device: ${deviceId}) ready status: ${ready}`);
    
    const game = games.get(gameId);
    if (!game) return;
    
    // Update ready players array
    if (ready) {
      // Add player to ready list if not already in it
      if (!game.readyPlayers.some(p => p.deviceId === deviceId)) {
        game.readyPlayers.push({ nickname, deviceId });
      }
    } else {
      // Remove player from ready list
      game.readyPlayers = game.readyPlayers.filter(p => p.deviceId !== deviceId);
    }
    
    // Broadcast updated ready players to everyone
    io.to(gameId).emit('player_ready', {
      readyPlayers: game.readyPlayers.map(p => p.nickname)
    });
    
    // Check if all unique players are ready to start the game
    const uniqueDevices = new Set(game.players.map(p => p.deviceId));
    const uniqueReadyDevices = new Set(game.readyPlayers.map(p => p.deviceId));
    
    if (uniqueDevices.size >= 2 && uniqueReadyDevices.size === uniqueDevices.size && !game.started) {
      console.log(`All players are ready in game ${gameId}, starting game...`);
      setTimeout(() => {
        if (!game.started) {
          game.started = true;
          io.to(gameId).emit('game_start');
          console.log(`Game ${gameId} started!`);
        }
      }, 1000);
    }
  });
  
  // Handle joining an existing game
  socket.on('join_game', ({ gameId, nickname, deviceId }) => {
    console.log(`Player attempting to join: ${gameId} as ${nickname} (device: ${deviceId})`);
    
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    // Check if this device is already in the game
    const deviceAlreadyInGame = game.players.some(p => p.deviceId === deviceId);
    const uniqueDevices = new Set(game.players.map(p => p.deviceId));
    
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
    
    // Check if game has capacity for this player
    if (game.players.length >= 2 && !deviceAlreadyInGame) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    // Join the socket to the game room
    socket.join(gameId);
    
    // Only add the player if their device isn't already in the game
    if (!deviceAlreadyInGame) {
      // Add player to the game
      game.players.push({nickname, deviceId, socketId: socket.id});
    }
    
    // Notify everyone in the room about the players
    io.to(gameId).emit('player_joined', { 
      players: game.players.map(p => p.nickname) 
    });
    
    // If there are now 2 unique devices in the game, auto-start after a delay
    // This gives both clients time to process the player_joined event
    const updatedUniqueDevices = new Set(game.players.map(p => p.deviceId));
    if (updatedUniqueDevices.size >= 2 && !game.started) {
      console.log(`Game ${gameId} has 2 unique devices, auto-starting in 1 second...`);
      setTimeout(() => {
        if (!game.started) {
          game.started = true;
          io.to(gameId).emit('game_start');
          console.log(`Game ${gameId} auto-started!`);
        }
      }, 1000);
    }
  });
  
  // Handle starting a game (this will still work for manual starts)
  socket.on('start_game', ({ gameId }) => {
    const game = games.get(gameId);
    
    if (!game) return;
    
    // We need at least 2 unique devices to start a game
    const uniqueDeviceCount = new Set(game.players.map(p => p.deviceId)).size;
    if (uniqueDeviceCount < 2) {
      socket.emit('error', { message: 'Need two different players to start the game' });
      return;
    }
    
    console.log(`Game ${gameId} started manually`);
    
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

// Handle all other GET requests
app.get('*', (req, res) => {
  if (!inDevelopmentMode) {
    // In production, serve the index.html file
    res.sendFile(path.join(distPath, 'index.html'));
  } else if (req.path !== '/') {
    // In development, redirect to root for any other paths
    res.redirect('/');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${inDevelopmentMode ? 'Development' : 'Production'}`);
});