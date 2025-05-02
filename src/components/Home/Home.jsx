import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';

const Home = () => {
  const navigate = useNavigate();
  const { nickname, setNickname, createGame, joinGame } = useGame();
  const [gameIdInput, setGameIdInput] = useState('');
  const [step, setStep] = useState(1); // 1: Enter nickname, 2: Create/Join game
  const [error, setError] = useState('');

  const handleSubmitNickname = (e) => {
    e.preventDefault();
    if (nickname.trim()) {
      setStep(2);
      setError('');
    } else {
      setError('Please enter a nickname');
    }
  };

  const handleCreateGame = () => {
    const newGameId = createGame();
    navigate(`/game/${newGameId}`);
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (gameIdInput.trim()) {
      joinGame(gameIdInput.trim());
      navigate(`/game/${gameIdInput.trim()}`);
    } else {
      setError('Please enter a valid game code');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-secondary-950 to-secondary-900">
      <div className="max-w-md w-full space-y-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center">
              <span className="text-4xl mr-2 text-white">♔</span>
              <span className="text-4xl ml-2 text-white">♚</span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-3 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Chess Arena
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Challenge your friends in real-time multiplayer chess!
          </p>
        </div>

        {step === 1 ? (
          <div className="bg-secondary-800 p-8 rounded-xl shadow-2xl border border-secondary-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Choose a Nickname</h2>
            <form onSubmit={handleSubmitNickname} className="space-y-6">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Nickname
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-600 rounded-lg bg-secondary-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your nickname"
                />
              </div>
              {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors text-white shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <span>Continue</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-secondary-800 p-8 rounded-xl shadow-2xl border border-secondary-700">
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient-gold">
              Welcome, <span className="text-primary-400">{nickname}</span>!
            </h2>
            <div className="space-y-8">
              <button
                onClick={handleCreateGame}
                className="w-full px-4 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors text-white shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Create New Game</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-1 rounded-full bg-secondary-800 text-gray-400 font-medium">OR</span>
                </div>
              </div>

              <form onSubmit={handleJoinGame} className="space-y-4">
                <div>
                  <label htmlFor="gameId" className="block text-sm font-medium text-gray-300 mb-2">
                    Game Code
                  </label>
                  <input
                    id="gameId"
                    name="gameId"
                    type="text"
                    required
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value)}
                    className="w-full px-4 py-3 border border-secondary-600 rounded-lg bg-secondary-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter game code"
                  />
                </div>
                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                <div>
                  <button
                    type="submit"
                    className="w-full px-4 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors text-white shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
                    </svg>
                    <span>Join Game</span>
                  </button>
                </div>
              </form>
              
              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Change Nickname</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Chess Arena. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Home;