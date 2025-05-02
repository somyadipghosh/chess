import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home/Home'
import Game from './components/Game/Game'
import { GameProvider } from './context/GameContext'

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </Router>
      </GameProvider>
    </div>
  )
}

export default App