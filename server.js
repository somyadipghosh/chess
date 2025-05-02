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

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle creating a new game
  socket.on('create_game', ({ gameId, nickname }) => {
    console.log(`Game created: ${gameId} by ${nickname}`);
    
    // Create a new game instance
    games.set(gameId, {
      id: gameId,
      players: [nickname],
      chess: new Chess(),
      started: false,
      moves: []
    });
    
    // Join the socket to the game room
    socket.join(gameId);
    
    // Notify everyone in the room about the player
    io.to(gameId).emit('player_joined', { players: [nickname] });
  });
  
  // Handle joining an existing game
  socket.on('join_game', ({ gameId, nickname }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    if (game.players.length >= 2) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    console.log(`Player ${nickname} joined game ${gameId}`);
    
    // Add player to the game
    game.players.push(nickname);
    
    // Join the socket to the game room
    socket.join(gameId);
    
    // Notify everyone in the room about the new player
    io.to(gameId).emit('player_joined', { players: game.players });
  });
  
  // Handle starting a game
  socket.on('start_game', ({ gameId }) => {
    const game = games.get(gameId);
    
    if (!game) return;
    if (game.players.length < 2) return;
    
    console.log(`Game ${gameId} started`);
    
    game.started = true;
    
    // Notify all players that the game has started
    io.to(gameId).emit('game_start');
  });
  
  // Handle a chess move
  socket.on('make_move', ({ gameId, move, player, notation }) => {
    const game = games.get(gameId);
    
    if (!game || !game.started) return;
    
    try {
      // Apply move to the server's chess instance
      const result = game.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      
      // Store move with notation
      game.moves.push({
        notation: notation || result.san,
        player
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
  socket.on('leave_game', ({ gameId, nickname }) => {
    leaveGame(socket, gameId, nickname);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and leave any games the user was part of
    for (const [gameId, game] of games.entries()) {
      if (game.players.includes(socket.data.nickname)) {
        leaveGame(socket, gameId, socket.data.nickname);
        break;
      }
    }
  });
  
  // Helper function for leaving a game
  function leaveGame(socket, gameId, nickname) {
    const game = games.get(gameId);
    if (!game) return;
    
    console.log(`Player ${nickname} left game ${gameId}`);
    
    // Remove player from the game
    const playerIndex = game.players.indexOf(nickname);
    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1);
      
      // If there are still players in the game
      if (game.players.length > 0) {
        // Notify remaining players
        io.to(gameId).emit('player_left', { 
          player: nickname, 
          players: game.players 
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