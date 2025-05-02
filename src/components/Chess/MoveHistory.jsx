import React, { useRef, useEffect, useState } from 'react';

const MoveHistory = ({ history = [] }) => {
  const historyContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastHistoryLength, setLastHistoryLength] = useState(0);

  // Track when the user manually scrolls
  useEffect(() => {
    const historyContainer = historyContainerRef.current;
    if (!historyContainer) return;

    const handleScroll = () => {
      // If we're not at the bottom, user has manually scrolled
      const isAtBottom = 
        historyContainer.scrollHeight - historyContainer.clientHeight <= 
        historyContainer.scrollTop + 10; // Adding a small buffer
      
      setShouldAutoScroll(isAtBottom);
    };

    historyContainer.addEventListener('scroll', handleScroll);
    return () => historyContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Only auto-scroll if the user hasn't manually scrolled up
  useEffect(() => {
    const historyContainer = historyContainerRef.current;
    if (!historyContainer || !shouldAutoScroll || history.length === lastHistoryLength) return;

    // If we should auto-scroll (user is at the bottom), scroll to the bottom
    if (history.length > lastHistoryLength) {
      historyContainer.scrollTop = historyContainer.scrollHeight;
      setLastHistoryLength(history.length);
    }
  }, [history, shouldAutoScroll, lastHistoryLength]);

  const formatMoveNumber = (index) => {
    return Math.floor(index / 2) + 1;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-secondary-700 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-semibold">Move History</h2>
        </div>
        
        {history.length > 5 && (
          <button 
            onClick={() => {
              if (historyContainerRef.current) {
                historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
                setShouldAutoScroll(true);
              }
            }}
            className="text-xs px-2 py-1 bg-secondary-700 hover:bg-secondary-600 rounded text-gray-300 flex items-center"
            title="Scroll to latest move"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
            Latest
          </button>
        )}
      </div>
      
      <div 
        ref={historyContainerRef}
        className="overflow-y-auto p-4 flex-grow scrollbar-thin h-64"
      >
        {history.length > 0 ? (
          <div className="space-y-1">
            {history.map((notation, index) => (
              <div 
                key={index} 
                className={`p-2 rounded ${index % 2 === 0 
                  ? 'bg-secondary-700 text-white' 
                  : 'bg-secondary-800 text-gray-300'}`}
              >
                <span className="font-mono text-xs text-primary-400 mr-2">
                  {index % 2 === 0 ? `${formatMoveNumber(index)}.` : ''}
                </span>
                <span className="font-medium">{notation}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-center">No moves yet.</p>
            <p className="text-center text-sm">Move history will appear here once the game starts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;