import React, { useState, useEffect } from 'react';
import Canvas3D from './components/Canvas3D';
import RotatingModel from './components/RotatingModel';
import ParticlesBackground from './components/ParticlesBackground';

function App() {
  const [isNearZero, setIsNearZero] = useState(false);

  const lerpColor = (color1, color2, t) => {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    const r = Math.round(((c2 >> 16) - (c1 >> 16)) * t + (c1 >> 16));
    const g = Math.round((((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t + ((c1 >> 8) & 0xff));
    const b = Math.round(((c2 & 0xff) - (c1 & 0xff)) * t + (c1 & 0xff));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  useEffect(() => {
    const root = document.documentElement;
    const startColors = isNearZero ? ['#2d2d2d', '#121212'] : ['#000', '#000'];
    const endColors = isNearZero ? ['#000', '#000'] : ['#2d2d2d', '#121212'];

    let t = 0;
    const duration = 1000; // 1 second for transition
    const step = 16 / duration;

    const animate = () => {
      if (t < 1) {
        t += step;
        root.style.setProperty('--gradient-start', lerpColor(startColors[0], endColors[0], t));
        root.style.setProperty('--gradient-end', lerpColor(startColors[1], endColors[1], t));
        requestAnimationFrame(animate);
      } else {
        root.style.setProperty('--gradient-start', endColors[0]);
        root.style.setProperty('--gradient-end', endColors[1]);
      }
    };

    animate();
  }, [isNearZero]);

  return (
    <div className="app"> 
    <ParticlesBackground isNearZero={isNearZero}></ParticlesBackground>
    <Canvas3D>
        <RotatingModel setIsNearZero={setIsNearZero} isNearZero={isNearZero} />
      </Canvas3D>
    </div>
  );
}

export default App;
