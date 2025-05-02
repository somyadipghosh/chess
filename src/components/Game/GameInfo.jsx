import React from 'react';

const GameInfo = ({ players, gameStatus, message, playerColor }) => {
  const getStatusStyles = () => {
    switch (gameStatus) {
      case 'waiting':
        return 'bg-amber-600 text-amber-50 border-amber-700';
      case 'ready':
        return 'bg-blue-600 text-blue-50 border-blue-700';
      case 'playing':
        return 'bg-green-600 text-green-50 border-green-700';
      case 'ended':
        return 'bg-gray-600 text-gray-50 border-gray-700';
      default:
        return 'bg-gray-600 text-gray-50 border-gray-700';
    }
  };

  const getStatusEmoji = () => {
    switch (gameStatus) {
      case 'waiting': return '⏳';
      case 'ready': return '👍';
      case 'playing': return '♟️';
      case 'ended': return '🏁';
      default: return '⏳';
    }
  };

  return (
    <div className="p-6 border-b border-secondary-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </span>
        Game Status
      </h2>
      
      {/* Status Badge with animation */}
      <div className="mb-4">
        <div className={`flex items-center px-4 py-2 rounded-lg border ${getStatusStyles()} shadow-inner`}>
          <span className="mr-2 text-lg">{getStatusEmoji()}</span>
          <span className="font-medium">
            {gameStatus === 'waiting' && 'Waiting for opponent'}
            {gameStatus === 'ready' && 'Ready to play'}
            {gameStatus === 'playing' && 'Game in progress'}
            {gameStatus === 'ended' && 'Game ended'}
          </span>
        </div>
      </div>
      
      {/* Status Message */}
      {message && (
        <div className="mb-4 p-3 bg-secondary-700 rounded-lg text-sm border border-secondary-600">
          <p className="text-gray-200">{message}</p>
        </div>
      )}
      
      {/* Players List with nicer styling */}
      <div>
        <h3 className="text-md font-medium text-gray-300 mb-2 flex items-center">
          <span className="mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </span>
          Players:
        </h3>
        
        <div className="space-y-2">
          {/* White Player */}
          <div className={`flex items-center p-3 rounded-lg ${players && players[0] ? 'bg-secondary-700' : 'bg-secondary-700 opacity-60'}`}>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 shadow-md">
              <span className="text-lg text-black">♔</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="font-medium">{players && players[0] ? players[0] : 'Waiting...'}</span>
                {players && players[0] === playerColor && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-700 text-primary-100 rounded-full">You</span>
                )}
              </div>
              <div className="text-xs text-gray-400">White</div>
            </div>
          </div>
          
          {/* Black Player */}
          <div className={`flex items-center p-3 rounded-lg ${players && players[1] ? 'bg-secondary-700' : 'bg-secondary-700 opacity-60'}`}>
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 border border-gray-600 shadow-md">
              <span className="text-lg text-white">♚</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="font-medium">{players && players[1] ? players[1] : 'Waiting...'}</span>
                {players && players[1] === playerColor && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-700 text-primary-100 rounded-full">You</span>
                )}
              </div>
              <div className="text-xs text-gray-400">Black</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;