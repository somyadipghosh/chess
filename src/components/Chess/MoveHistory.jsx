import React, { useRef, useEffect } from 'react';

const MoveHistory = ({ history = [] }) => {
  const historyEndRef = useRef(null);

  // Auto-scroll to the bottom when new moves are added
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const formatMoveNumber = (index) => {
    return Math.floor(index / 2) + 1;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-secondary-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 className="text-xl font-semibold">Move History</h2>
      </div>
      
      <div className="overflow-y-auto p-4 flex-grow scrollbar-thin h-64">
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
            <div ref={historyEndRef} />
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