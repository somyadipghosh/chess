import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

const GameChat = () => {
  const { socket, gameId, nickname } = useGame();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set up socket listener for incoming chat messages
  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    return () => {
      socket.off('chat_message');
    };
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    const messageData = {
      gameId,
      sender: nickname,
      text: message.trim(),
      timestamp: new Date().toISOString(),
    };

    // Send to server and add to local messages
    socket.emit('send_message', messageData);
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setMessage('');
  };

  // Format timestamp in a human-readable way
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-secondary-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        <h2 className="text-xl font-semibold">Game Chat</h2>
      </div>
      
      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
        {messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === nickname ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 break-words shadow
                    ${msg.sender === nickname 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-secondary-700 text-gray-200'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">
                      {msg.sender === nickname ? 'You' : msg.sender}
                    </span>
                    <span className="text-xs opacity-70 ml-2">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-3 opacity-50" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <p className="text-center">No messages yet.</p>
            <p className="text-center text-sm mt-1">Send a message to start chatting with your opponent.</p>
          </div>
        )}
      </div>
      
      {/* Message input form */}
      <div className="p-3 border-t border-secondary-700">
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2 bg-secondary-700 border border-secondary-600 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-white"
          />
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 px-4 rounded-r-lg transition-colors flex items-center justify-center"
            disabled={!message.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameChat;