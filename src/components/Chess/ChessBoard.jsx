import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Chess } from 'chess.js';

// Chess piece Unicode characters
const pieces = {
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
};

const ChessBoard = ({ latestFen }) => {
  const { socket, gameId, playerColor, makeMove, gameStarted } = useGame();
  const [chess, setChess] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [lastMove, setLastMove] = useState(null);
  
  // Initialize board orientation based on player color
  useEffect(() => {
    if (playerColor) {
      setBoardOrientation(playerColor);
    }
  }, [playerColor]);
  
  // Update the chess board whenever latestFen changes
  useEffect(() => {
    if (latestFen) {
      console.log("Updating board with FEN:", latestFen);
      try {
        setChess(new Chess(latestFen));
      } catch (e) {
        console.error("Invalid FEN received:", e);
      }
    }
  }, [latestFen]);
  
  // Handle incoming moves from opponent
  useEffect(() => {
    if (!socket) return;
    
    socket.on('game_move', ({ move, fen }) => {
      try {
        // Use the FEN from the server to ensure all clients have the same board state
        if (fen) {
          console.log("Move received with FEN:", fen);
          setChess(new Chess(fen));
        } else {
          // Fallback to local move application if server doesn't provide FEN
          setChess((prevChess) => {
            const newChess = new Chess(prevChess.fen());
            newChess.move(move);
            return newChess;
          });
        }
        setLastMove(move);
      } catch (e) {
        console.error('Invalid move received:', e);
      }
    });
    
    return () => {
      socket.off('game_move');
    };
  }, [socket]);
  
  // Handle square click
  const handleSquareClick = (square) => {
    // Don't allow moves if the game hasn't started
    if (!gameStarted) return;
    
    // Don't allow moves if it's not the player's turn
    const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
    if (currentTurn !== playerColor) return;
    
    // If a square is already selected, try to make a move
    if (selectedSquare) {
      // Check if the clicked square is a possible move
      if (possibleMoves.includes(square)) {
        try {
          const move = {
            from: selectedSquare,
            to: square,
            promotion: 'q', // Always promote to queen for simplicity
          };
          
          // Update local chess instance
          const newChess = new Chess(chess.fen());
          const result = newChess.move(move);
          setChess(newChess);
          
          // Generate algebraic notation for the move
          const moveNotation = result.san;
          
          // Send move to server with notation and the new FEN
          makeMove({ 
            from: selectedSquare, 
            to: square, 
            promotion: 'q',
            notation: moveNotation,
            fen: newChess.fen()
          });
          
          // Keep track of the last move
          setLastMove(move);
          
          // Reset selection
          setSelectedSquare(null);
          setPossibleMoves([]);
        } catch (e) {
          console.error('Invalid move:', e);
        }
      } else {
        // Check if the clicked square contains one of the player's pieces
        const piece = chess.get(square);
        if (piece && ((piece.color === 'w' && playerColor === 'white') || 
                     (piece.color === 'b' && playerColor === 'black'))) {
          // Select the new square
          setSelectedSquare(square);
          // Get possible moves for the new selection
          const moves = chess.moves({ square, verbose: true });
          setPossibleMoves(moves.map(move => move.to));
        } else {
          // Reset selection
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      }
    } else {
      // No square selected yet, check if there's a piece on the clicked square
      const piece = chess.get(square);
      if (piece && ((piece.color === 'w' && playerColor === 'white') || 
                   (piece.color === 'b' && playerColor === 'black'))) {
        // Select the square
        setSelectedSquare(square);
        // Get possible moves
        const moves = chess.moves({ square, verbose: true });
        setPossibleMoves(moves.map(move => move.to));
      }
    }
  };
  
  // Get piece for a square
  const getPiece = (square) => {
    const piece = chess.get(square);
    return piece ? pieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] : null;
  };
  
  // Generate the squares for the chessboard
  const renderBoard = () => {
    const board = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    
    // If board is flipped for black player
    const orderedFiles = boardOrientation === 'black' ? [...files].reverse() : files;
    const orderedRanks = boardOrientation === 'black' ? [...ranks].reverse() : ranks;
    
    // Create board rows
    for (let rank of orderedRanks) {
      const row = [];
      
      // Create squares in each row
      for (let file of orderedFiles) {
        const square = `${file}${rank}`;
        const piece = getPiece(square);
        
        // Determine square color
        const isLightSquare = (file.charCodeAt(0) - 'a'.charCodeAt(0) + rank) % 2 === 0;
        
        // Determine if square is selected or a possible move
        const isSelected = selectedSquare === square;
        const isPossibleMove = possibleMoves.includes(square);
        
        // Check if this square is part of the last move
        const isLastMoveFrom = lastMove && lastMove.from === square;
        const isLastMoveTo = lastMove && lastMove.to === square;
        
        row.push(
          <div 
            key={square}
            className={`w-square h-square flex items-center justify-center select-none relative
              ${isLightSquare ? 'bg-board-light' : 'bg-board-dark'} 
              ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
              ${isPossibleMove && !piece ? 'cursor-pointer hover:bg-opacity-80' : ''}
              ${isPossibleMove && piece ? 'ring-2 ring-red-500 ring-opacity-70' : ''}
              ${isLastMoveFrom ? 'bg-opacity-85' : ''}
              ${isLastMoveTo ? 'bg-opacity-75' : ''}
              ${!isPossibleMove && !isSelected ? 'hover:bg-opacity-90' : ''}
              transition-all duration-200 ease-in-out cursor-pointer`}
            onClick={() => handleSquareClick(square)}
            data-square={square}
          >
            {piece && (
              <span className={`chess-piece text-3xl ${piece.color === 'w' ? 'text-white' : 'text-black'}`}>
                {piece}
              </span>
            )}
            
            {/* Coordinates labels with improved visibility */}
            {(file === (boardOrientation === 'black' ? 'h' : 'a') && (
              <span className={`absolute bottom-1 left-1 text-xs font-medium ${isLightSquare ? 'text-board-dark' : 'text-board-light'} opacity-80`}>
                {rank}
              </span>
            ))}
            
            {(rank === (boardOrientation === 'black' ? '1' : '8') && (
              <span className={`absolute top-1 right-1 text-xs font-medium ${isLightSquare ? 'text-board-dark' : 'text-board-light'} opacity-80`}>
                {file}
              </span>
            ))}
            
            {/* Highlight for possible moves */}
            {isPossibleMove && !piece && (
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 bg-opacity-70"></div>
            )}
            
            {/* Subtle highlight for last move */}
            {(isLastMoveFrom || isLastMoveTo) && (
              <div className="absolute inset-0 highlight-last-move pointer-events-none"></div>
            )}
          </div>
        );
      }
      
      // Add row to board
      board.push(
        <div key={`rank-${rank}`} className="flex">
          {row}
        </div>
      );
    }
    
    return board;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="border-4 border-gray-800 rounded-chess overflow-hidden shadow-2xl">
        {renderBoard()}
      </div>
      
      {/* Game status indicators with improved styling */}
      <div className="mt-4 space-y-2">
        {chess.isCheckmate() && (
          <div className="p-3 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-lg font-bold text-lg shadow-lg flex items-center justify-center">
            <span className="mr-2 text-xl">♛</span>
            Checkmate! {chess.turn() === 'w' ? 'Black' : 'White'} wins!
            <span className="ml-2 text-xl">♕</span>
          </div>
        )}
        
        {chess.isDraw() && (
          <div className="p-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-lg font-bold text-lg shadow-lg">
            Game drawn!
          </div>
        )}
        
        {chess.isCheck() && !chess.isCheckmate() && (
          <div className="p-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-lg font-bold text-lg shadow-lg">
            Check!
          </div>
        )}
        
        {/* Turn indicator with contrasting colors */}
        {gameStarted && !chess.isGameOver() && (
          <div className={`p-3 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center space-x-2
                          ${chess.turn() === 'w' 
                            ? 'bg-gradient-to-r from-slate-100 to-white text-gray-900' 
                            : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white'}`}>
            <span className="text-xl">{chess.turn() === 'w' ? '♔' : '♚'}</span>
            <span>{chess.turn() === 'w' ? 'White' : 'Black'}'s turn</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessBoard;