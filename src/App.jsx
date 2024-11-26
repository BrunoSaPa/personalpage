import React, { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';

function App() {
  const [rows, setRows] = useState(0);
  const [speed, setSpeed] = useState(10);
  const [rowHeight, setRowHeight] = useState(0);

  useEffect(() => {
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const calculateLayout = () => {
      const screenHeight = window.innerHeight;
      
      // Dynamically calculate row height based on screen size
      const calculatedRowHeight = screenHeight / Math.floor(screenHeight / 35);
      
      // Calculate number of rows needed to fill screen
      const calculatedRows = Math.ceil(screenHeight / calculatedRowHeight);

      // Update state
      setRowHeight(calculatedRowHeight);
      setRows(calculatedRows);
    };

    // Calculate initial layout
    calculateLayout();

    // Recalculate on window resize
    window.addEventListener('resize', calculateLayout);

    // Prevent default scroll behavior
    const preventDefault = (e) => {
      e.preventDefault();
    };

    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });

    // Cleanup event listeners and restore scrolling
    return () => {
      window.removeEventListener('resize', calculateLayout);
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
      
      // Restore scrolling
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Marquee
          key={index}
          style={{ 
            height: `${rowHeight}px`, 
            margin: 0,
            padding: 0,
            userSelect: 'none',
          }}
          autoFill
          speed={speed}
          gradient
          gradientColor={'#2D2D2A'}
          direction={index % 2 === 0 ? 'left' : 'right'}
        >
          WIP
          ‏‏‎ ‎
          ‏‏‎ ‎
        </Marquee>
      ))}
    </div>
  );
}

export default App;