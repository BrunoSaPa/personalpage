import React from 'react';
import Canvas3D from './components/Canvas3D';
import RotatingModel from './components/RotatingModel';

function App() {
  return (
    <div>
      <Canvas3D>
        <RotatingModel />
      </Canvas3D>
    </div>
  );
}

export default App;
