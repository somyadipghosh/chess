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
    readyPlayers,
    gameStarted,
    setGameStarted,
    playerColor,
    deviceId,
    error,
    setError
  } = useGame();
  
  const [waitingForOpponent, setWaitingForOpponent] = useState(true);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastFen, setLastFen] = useState(null); // Store the latest FEN position
  const [showErrorModal, setShowErrorModal] = useState(false);

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

  // Show error modal if there's an error
  useEffect(() => {
    if (error) {
      setShowErrorModal(true);
    }
  }, [error]);

  // Join game when we have all the necessary info
  useEffect(() => {
    if (socket && gameId && nickname && !playerColor) {
      // If no playerColor is set, we're joining an existing game
      socket.emit('join_game', { gameId, nickname, deviceId });
    }
  }, [socket, gameId, nickname, playerColor, deviceId]);

  // Update waiting state when players list changes
  useEffect(() => {
    if (players.length >= 2) {
      setWaitingForOpponent(false);
      if (!gameStarted) {
        setGameStatus('ready');
      }
    } else {
      setWaitingForOpponent(true);
      setGameStatus('waiting');
    }
  }, [players, gameStarted]);

  // Update game status based on ready players
  useEffect(() => {
    if (players.length >= 2 && !gameStarted) {
      if (readyPlayers.length === players.length) {
        setMessage('All players are ready! Game is starting...');
      } else if (readyPlayers.length > 0) {
        setMessage(`${readyPlayers.length}/${players.length} players are ready. Game will start when all players are ready.`);
      } else {
        setMessage('All players have joined! Both players need to click "Ready to Play" to start the game.');
      }
    }
  }, [players, readyPlayers, gameStarted]);

  // Update UI state when game starts
  useEffect(() => {
    if (gameStarted) {
      setWaitingForOpponent(false);
      setGameStatus('playing');
      setMessage('The game has started! White moves first.');
    }
  }, [gameStarted]);

  useEffect(() => {
    if (!socket) return;

    // Listen for player joining the game
    socket.on('player_joined', ({ players: gamePlayers }) => {
      console.log("Player joined event received with players:", gamePlayers);
      setPlayers(gamePlayers);
      if (gamePlayers.length >= 2) {
        setWaitingForOpponent(false);
        if (!gameStarted) {
          setGameStatus('ready');
          setMessage('All players have joined! Both players need to click "Ready to Play" to start the game.');
        }
      }
    });

    // Listen for player leaving the game
    socket.on('player_left', ({ player, players: remainingPlayers }) => {
      console.log(`Player ${player} left the game`);
      setPlayers(remainingPlayers);
      
      if (!gameStarted) {
        setMessage(`${player} left the game. Waiting for new opponent...`);
        setWaitingForOpponent(true);
        setGameStatus('waiting');
      }
    });

    // Listen for player ready status updates
    socket.on('player_ready', ({ readyPlayers: gameReadyPlayers }) => {
      console.log("Ready players updated:", gameReadyPlayers);
      if (!gameStarted && players.length >= 2) {
        if (gameReadyPlayers.length === players.length) {
          setMessage('All players are ready! Game is starting...');
        } else {
          setMessage(`${gameReadyPlayers.length}/${players.length} players are ready. Game will start when all players are ready.`);
        }
      }
    });

    // Listen for errors
    socket.on('error', ({ message }) => {
      setError(message);
      setMessage(`Error: ${message}`);
    });

    // Listen for game start
    socket.on('game_start', () => {
      console.log("Game start event received!");
      setGameStarted(true);
      setWaitingForOpponent(false);
      setGameStatus('playing');
      setMessage('The game has started! White moves first.');
    });

    // Listen for game moves
    socket.on('game_move', ({ move, notation, fen }) => {
      console.log("Game move received:", notation, fen);
      // Add move to history
      setMoveHistory(prev => [...prev, notation]);
      
      // Always store the latest FEN position from the server
      if (fen) {
        console.log("Updating board FEN:", fen);
        setLastFen(fen);
      }
    });

    // Listen for game over
    socket.on('game_over', ({ result, reason }) => {
      setGameStatus('ended');
      setMessage(`Game over: ${result}. ${reason}`);
    });

    // Cleanup listeners on component unmount
    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('player_ready');
      socket.off('error');
      socket.off('game_start');
      socket.off('game_move');
      socket.off('game_over');
    };
  }, [socket, players, setPlayers, gameStarted, setGameStarted, setError]);

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

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setError('');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-950 to-secondary-900 text-white p-4 md:p-6">
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-secondary-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-secondary-700">
            <div className="text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold mt-2">Error</h2>
            </div>
            <p className="text-center mb-4">{error}</p>
            <button
              onClick={handleErrorModalClose}
              className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

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
                readyPlayers={readyPlayers}
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
              <ChessBoard latestFen={lastFen} />
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