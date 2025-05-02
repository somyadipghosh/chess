import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [nickname, setNickname] = useState('');
  const [gameId, setGameId] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState('');
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  // Add a unique device ID to distinguish different devices
  const [deviceId] = useState(() => {
    // Try to get existing device ID from local storage
    const savedDeviceId = localStorage.getItem('chess_device_id');
    if (savedDeviceId) return savedDeviceId;
    
    // Generate new device ID if none exists
    const newDeviceId = uuidv4();
    localStorage.setItem('chess_device_id', newDeviceId);
    return newDeviceId;
  });

  useEffect(() => {
    // Determine the socket URL based on the environment
    const socketUrl = import.meta.env.PROD 
      ? window.location.origin  // In production, use the same origin
      : 'http://localhost:3001'; // In development, connect to the separate server

    console.log('Connecting to socket server at:', socketUrl);
    
    // Initialize socket connection
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Socket cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for player joined events
    socket.on('player_joined', ({ players: gamePlayers }) => {
      console.log('Player joined event received:', gamePlayers);
      setPlayers(gamePlayers);
    });

    // Listen for player ready status
    socket.on('player_ready', ({ readyPlayers: gamePlayers }) => {
      console.log('Ready players:', gamePlayers);
      setReadyPlayers(gamePlayers);
    });

    // Listen for game start confirmation
    socket.on('game_start', () => {
      console.log('Game has started!');
      setGameStarted(true);
    });

    // Cleanup listener when component unmounts
    return () => {
      socket.off('player_joined');
      socket.off('player_ready');
      socket.off('game_start');
    };
  }, [socket]);

  // Generate a new game ID
  const createGame = () => {
    const newGameId = uuidv4().substring(0, 6);
    setGameId(newGameId);
    if (socket) {
      console.log('Creating new game:', newGameId, 'as', nickname);
      socket.emit('create_game', { gameId: newGameId, nickname, deviceId });
      setPlayerColor('white');
    }
    return newGameId;
  };

  // Join an existing game
  const joinGame = (gameIdToJoin) => {
    if (socket) {
      console.log('Joining game:', gameIdToJoin, 'as', nickname);
      socket.emit('join_game', { gameId: gameIdToJoin, nickname, deviceId });
      setGameId(gameIdToJoin);
      setPlayerColor('black');
    }
  };

  // Signal player ready status
  const toggleReady = () => {
    if (socket && gameId) {
      const newReadyStatus = !isReady;
      setIsReady(newReadyStatus);
      socket.emit('player_ready', { gameId, nickname, deviceId, ready: newReadyStatus });
    }
  };

  // Handle player move
  const makeMove = (move) => {
    if (socket) {
      socket.emit('make_move', { gameId, move, player: nickname, deviceId });
    }
  };

  // Game state values and functions
  const value = {
    socket,
    nickname,
    setNickname,
    gameId,
    setGameId,
    players,
    setPlayers,
    readyPlayers,
    isReady,
    toggleReady,
    currentPlayer,
    setCurrentPlayer,
    gameStarted,
    setGameStarted,
    playerColor,
    setPlayerColor,
    createGame,
    joinGame,
    makeMove,
    deviceId
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export default GameContext;