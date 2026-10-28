import { useCallback, useRef, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import DitherBackground from './components/DitherBackground';
import FlowerScene from './components/FlowerScene';
import { DitherText } from './components/DitherText';

function App() {
  const [isDying, setIsDying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const appRef = useRef(null);
  const motion = useRef({ turn: 0, life: 1 });
  const handleReady = useCallback(() => setIsReady(true), []);
  const handleMotion = useCallback((turn, life) => {
    motion.current.turn = turn;
    motion.current.life = life;
    appRef.current?.style.setProperty('--life', life);
  }, []);

  return (
    <div ref={appRef} className="app" data-phase={isDying ? 'dying' : 'alive'}>
      <DitherBackground isDying={isDying} motion={motion} />
      <div className={`cinematic-overlay${isReady ? ' revealed' : ''}`} aria-hidden="true" />
      <FlowerScene isDying={isDying} motion={motion} onMotion={handleMotion} onPhaseChange={setIsDying} onReady={handleReady} />
      <div className="text-below" aria-hidden={isDying}>
        <DitherText
          as="h1"
          className="title"
          color="#e8e5d7"
          fill="gradient"
          direction="down"
          from={1}
          to={0.45}
          matrix="blue-noise"
          cell={1}
          animate={!isDying}
          speed={0.4}
        >
          <TypeAnimation
            sequence={[
              'Be passionate', 900,
              'Be passionate.', 200,
              'Be passionate..', 200,
              'Be passionate...', 2000,
              'Be passionate.', 300,
              'Be passion', 400,
              'Be obsessed', 2000,
              'Be obsessed.', 5000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
          />
        </DitherText>
      </div>
    </div>
  );
}

export default App;
