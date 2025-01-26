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
    const startColors = isNearZero ? ['#2d2d2d', '#121212'] : ['#000', '#000'];
    const endColors = isNearZero ? ['#000', '#000'] : ['#2d2d2d', '#121212'];

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

  return (
    <div className="app">
      <ParticlesBackground isNearZero={isNearZero} />
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
          <ul className="social-links">
            {socialLinks.map(link => (
              <li key={link.id}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                  {link.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default App;