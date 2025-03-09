import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import Canvas3D from './components/Canvas3D';
import RotatingModel from './components/RotatingModel';
import ParticlesBackground from './components/ParticlesBackground';
import { Github, Instagram, Linkedin, Mail } from 'lucide-react';

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

  const socialLinks = [
    { id: 1, href: 'https://github.com/BrunoSaPa', icon: <Github size={24} />, label: 'GitHub' },
    { id: 2, href: 'https://www.instagram.com/bruno.sapa/', icon: <Instagram size={24} />, label: 'Instagram' },
    { id: 3, href: 'https://www.linkedin.com/in/bruno-sanchez-padilla/', icon: <Linkedin size={24} />, label: 'LinkedIn' },
    { id: 4, href: 'mailto:brunosanchezpadilla@gmail.com', icon: <Mail size={24} />, label: 'Email' },
  ];

  useEffect(() => {
    const root = document.documentElement;
    const startColors = isNearZero ? ['#000', '#0A0A0A'] : ['#000', '#000'];
    const endColors = isNearZero ? ['#000', '#000'] : ['#000', '#0A0A0A'];

    let t = 0;
    const duration = 1000;
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

  useEffect(() => {
    const root = document.documentElement;
  
    // Define start and end colors for transition
    const startColors = isNearZero
      ? ['#000', '#679436', '#873f00', '#FCBA04', '#000'] 
      : ['#000', '#000', '#000', '#000', '#000']; 
  
    const endColors = isNearZero
      ? ['#000', '#000', '#000', '#000', '#000']
      : ['#000', '#679436', '#873f00', '#FCBA04', '#000'];
  
    let t = 0;
    const duration = 1000;
    const step = 16 / duration;
  
    const animate = () => {
      if (t < 1) {
        t += step;
        root.style.setProperty('--el-color1', lerpColor(startColors[0], endColors[0], t));
        root.style.setProperty('--el-color2', lerpColor(startColors[1], endColors[1], t));
        root.style.setProperty('--el-color3', lerpColor(startColors[2], endColors[2], t));
        root.style.setProperty('--el-color4', lerpColor(startColors[3], endColors[3], t));
        root.style.setProperty('--el-color5', lerpColor(startColors[4], endColors[4], t));
  
        requestAnimationFrame(animate);
      } else {
        root.style.setProperty('--el-color1', endColors[0]);
        root.style.setProperty('--el-color2', endColors[1]);
        root.style.setProperty('--el-color3', endColors[2]);
        root.style.setProperty('--el-color4', endColors[3]);
        root.style.setProperty('--el-color5', endColors[4]);
      }
    };
  
    animate();
  }, [isNearZero]);
  

  return (
    <div className="app">
      <div className="el"></div>
      <div className="content-wrapper">
        <Canvas3D>
          <RotatingModel setIsNearZero={setIsNearZero} isNearZero={isNearZero} />
        </Canvas3D>
        <div className={`text-below ${isNearZero ? 'fade-out' : 'fade-in'}`}>
          <TypeAnimation
            sequence={[
              'Be passionate',
              500,
              'Be passionate.',
              200,
              'Be passionate..',
              200,
              'Be passionate...',
              500,
              'Be obsessed',
              1000,
              'Be obsessed.',
              3500,
            ]}
            wrapper="h1"
            speed={50}
            className="title"
            repeat={Infinity}
          />
        </div>

      </div>
    </div>
  );
}

export default App;