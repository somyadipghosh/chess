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
  // Add a unique device ID to distinguish different devices
  const [deviceId] = useState(uuidv4());

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('https://multiplayer-chess-server.glitch.me');
    setSocket(newSocket);

    // Socket cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Generate a new game ID
  const createGame = () => {
    const newGameId = uuidv4().substring(0, 6);
    setGameId(newGameId);
    if (socket) {
      socket.emit('create_game', { gameId: newGameId, nickname, deviceId });
      setPlayerColor('white');
    }
    return newGameId;
  };

  // Join an existing game
  const joinGame = (gameIdToJoin) => {
    if (socket) {
      socket.emit('join_game', { gameId: gameIdToJoin, nickname, deviceId });
      setGameId(gameIdToJoin);
      setPlayerColor('black');
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