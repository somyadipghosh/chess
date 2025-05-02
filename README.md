# Multiplayer Chess Game

A real-time multiplayer chess game built with React, Socket.IO, and Tailwind CSS.

## Features

- Create and join games with a unique game code
- Real-time gameplay with instant move synchronization
- Chat with your opponent during the game
- Move history tracking
- Responsive design works on desktop and mobile
- Visual indicators for legal moves, check, and checkmate
- Game state indicators (whose turn, game status)

## Technologies Used

- **Frontend**: React, Tailwind CSS, React Router
- **Game Logic**: chess.js
- **Real-time Communication**: Socket.IO
- **Backend**: Express.js
- **Build Tool**: Vite

## How to Run

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start both the client and server:
   ```
   npm run start
   ```
4. Open your browser and go to http://localhost:3000

## How to Play

1. Enter a nickname on the home screen
2. Choose to create a new game or join an existing game with a code
3. If creating a new game:
   - You will be assigned as the white player
   - Share the generated game code with your opponent
   - Wait for them to join
   - Click "Start Game" when they've joined
4. If joining a game:
   - Enter the game code you received
   - You will be assigned as the black player
   - Wait for the host to start the game
5. Make moves by clicking on a piece and then clicking on a valid destination

## Game Controls

- **Creating a Game**: Generates a unique code to share
- **Joining a Game**: Enter a code to join an existing game
- **Starting a Game**: Only the host (white player) can start the game
- **Resigning**: Concedes the match to your opponent
- **Chat**: Send messages during the game
- **Move History**: View a list of all moves made

## Development

- Run the client in development mode: `npm run dev`
- Run the server separately: `npm run server`
- Build for production: `npm run build`
