import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

const GameControls = ({ waitingForOpponent, gameStatus, playerColor, startGame, leaveGame }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isReady, toggleReady, readyPlayers, gameStarted, players } = useGame();
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </span>
        Game Controls
      </h2>
      
      <div className="space-y-4">
        {/* Ready Status Display */}
        {!gameStarted && players.length >= 2 && (
          <div className="mb-4">
            <h3 className="text-gray-300 text-sm mb-2">Player Status:</h3>
            <div className="bg-secondary-700 rounded-lg p-3 space-y-2">
              {players.map((player, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{player}</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    readyPlayers.includes(player) 
                      ? 'bg-green-800 text-green-200' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {readyPlayers.includes(player) ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Ready Button - Only shown when not playing yet and 2 players have joined */}
        {!gameStarted && players.length >= 2 && (
          <button 
            onClick={toggleReady}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center
              ${isReady 
                ? 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600' 
                : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'}`
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              {isReady ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              )}
            </svg>
            {isReady ? 'Cancel Ready' : 'Ready to Play'}
          </button>
        )}

        {/* Waiting for opponent message - Shown when waiting for opponent */}
        {waitingForOpponent && (
          <div className="w-full py-3 px-4 bg-secondary-700 border border-secondary-600 rounded-lg text-center text-gray-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 animate-pulse text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Waiting for opponent to join...
          </div>
        )}
        
        {/* Resign Button - Only shown when game is in progress */}
        {gameStatus === 'playing' && !showConfirmation && (
          <button 
            onClick={() => setShowConfirmation(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                     rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Resign Game
          </button>
        )}
        
        {/* Confirmation for resignation */}
        {showConfirmation && (
          <div className="bg-secondary-700 rounded-lg p-5 space-y-4 border border-secondary-600 shadow-lg">
            <div className="flex items-center text-center justify-center mb-2 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Are you sure you want to resign?</span>
            </div>
            
            <p className="text-center text-gray-400 text-sm">This will end the game and count as a loss for you.</p>
            
            <div className="flex space-x-3">
              <button 
                onClick={leaveGame}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md font-medium transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Yes, Resign
              </button>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-md font-medium transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 010-1.414L10.586 3.1a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414l9-9z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Leave Game Button - Always shown except when showing resignation confirmation */}
        {!showConfirmation && (
          <button 
            onClick={leaveGame}
            className="w-full py-3 px-4 bg-transparent border border-secondary-600 hover:bg-secondary-700 
                    rounded-lg font-medium transition-colors flex items-center justify-center mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Leave Game
          </button>
        )}
      </div>
    </div>
  );
};

export default GameControls;