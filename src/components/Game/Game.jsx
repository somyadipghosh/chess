import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import ChessBoard from '../Chess/ChessBoard';
import MoveHistory from '../Chess/MoveHistory';
import GameInfo from './GameInfo';
import GameControls from './GameControls';
import GameChat from './GameChat';

const Game = () => {
  const { gameId: routeGameId } = useParams();
  const navigate = useNavigate();
  const { 
    socket, 
    gameId, 
    setGameId, 
    nickname, 
    players, 
    setPlayers,
    gameStarted,
    setGameStarted,
    playerColor,
    deviceId
  } = useGame();
  
  const [waitingForOpponent, setWaitingForOpponent] = useState(true);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);

  useEffect(() => {
    // Set game ID from the route parameter
    if (routeGameId && !gameId) {
      setGameId(routeGameId);
    }
    
    // Redirect to home if there's no nickname
    if (!nickname) {
      navigate('/');
    }
  }, [routeGameId, gameId, nickname, navigate, setGameId]);

  useEffect(() => {
    if (!socket) return;

    // Listen for player joining the game
    socket.on('player_joined', ({ players: gamePlayers }) => {
      setPlayers(gamePlayers);
      if (gamePlayers.length >= 2) {
        setWaitingForOpponent(false);
        setGameStatus('ready');
        setMessage('All players have joined! The game can now start.');
      }
    });

    // Listen for errors
    socket.on('error', ({ message }) => {
      setMessage(`Error: ${message}`);
    });

    // Listen for game start
    socket.on('game_start', () => {
      setGameStarted(true);
      setWaitingForOpponent(false); // Ensure waiting state is updated when game starts
      setGameStatus('playing');
      setMessage('The game has started! White moves first.');
    });

    // Listen for game moves
    socket.on('game_move', ({ move, notation }) => {
      // Add move to history
      setMoveHistory(prev => [...prev, notation]);
    });

    // Listen for game over
    socket.on('game_over', ({ result, reason }) => {
      setGameStatus('ended');
      setMessage(`Game over: ${result}. ${reason}`);
    });

    // Cleanup listeners on component unmount
    return () => {
      socket.off('player_joined');
      socket.off('error');
      socket.off('game_start');
      socket.off('game_move');
      socket.off('game_over');
    };
  }, [socket, setPlayers, setGameStarted]);

  // Copy game code to clipboard
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start the game (only allowed for the creator/white player)
  const startGame = () => {
    if (playerColor === 'white' && players.length >= 2) {
      socket.emit('start_game', { gameId });
    }
  };

  // Leave the game and go back to home
  const leaveGame = () => {
    if (socket) {
      socket.emit('leave_game', { gameId, nickname, deviceId });
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-950 to-secondary-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with game title and game code */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-secondary-800 rounded-xl p-4 shadow-lg border border-secondary-700">
            <div className="flex items-center">
              <span className="text-2xl md:text-3xl font-bold mr-2">♔</span>
              <h1 className="text-2xl md:text-3xl font-bold">Chess Arena</h1>
            </div>
            
            <div className="flex items-center space-x-2 bg-secondary-700 rounded-lg px-3 py-2">
              <span className="text-gray-300 text-sm">Game Code:</span>
              <span className="font-mono font-medium">{gameId}</span>
              <button 
                onClick={copyGameCode} 
                className={`ml-2 p-1.5 rounded-md transition-colors ${copied ? 'bg-green-600' : 'bg-primary-600 hover:bg-primary-700'}`}
                title="Copy game code"
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                    <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Main game layout: sidebar + board + chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Game info and controls */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-secondary-800 rounded-xl overflow-hidden shadow-lg border border-secondary-700">
              {/* Game Status */}
              <GameInfo 
                players={players} 
                gameStatus={gameStatus} 
                message={message} 
                playerColor={playerColor}
              />

              {/* Game Controls */}
              <GameControls 
                waitingForOpponent={waitingForOpponent} 
                gameStatus={gameStatus} 
                playerColor={playerColor} 
                startGame={startGame} 
                leaveGame={leaveGame} 
              />
            </div>
            
            {/* Move History */}
            <div className="bg-secondary-800 rounded-xl overflow-hidden shadow-lg border border-secondary-700">
              <MoveHistory history={moveHistory} />
            </div>
          </div>
          
          {/* Center - Chess Board */}
          <div className="lg:col-span-6">
            <div className="flex justify-center">
              <ChessBoard />
            </div>
          </div>
          
          {/* Right sidebar - Chat */}
          <div className="lg:col-span-3 h-full">
            <div className="bg-secondary-800 rounded-xl overflow-hidden shadow-lg border border-secondary-700 h-full">
              <GameChat />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Chess Arena. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Game;