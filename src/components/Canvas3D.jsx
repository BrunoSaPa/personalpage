import React from 'react';
import { Canvas } from '@react-three/fiber';

const Canvas3D = ({ children }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {children}
    </Canvas>
  );
};

export default Canvas3D;
