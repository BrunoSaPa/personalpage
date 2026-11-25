import { useCallback, useEffect, useRef, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import DitherBackground from './components/DitherBackground';
import FlowerScene from './components/FlowerScene';
import { DitherText } from './components/DitherText';

function App() {
  const [isDying, setIsDying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const appRef = useRef(null);
  const titleRef = useRef(null);
  const motion = useRef({ turn: 0, life: 1 });
  const handleReady = useCallback(() => setIsReady(true), []);
  const handleMotion = useCallback((turn, life, bloomOffset) => {
    motion.current.turn = turn;
    motion.current.life = life;
    appRef.current?.style.setProperty('--life', life);
    titleRef.current?.style.setProperty('--bloom-offset', `${bloomOffset}px`);
  }, []);

  useEffect(() => {
    const title = titleRef.current;
    const label = title.firstElementChild;
    const range = document.createRange();
    const observer = new ResizeObserver(() => {
      const text = label.firstChild;
      const periods = text?.textContent.match(/\.+$/)?.[0].length ?? 0;
      let offset = 0;
      if (periods) {
        range.setStart(text, text.length - periods);
        range.setEnd(text, text.length);
        offset = range.getBoundingClientRect().width / 2;
      }
      // Hang the periods so the words keep their center as the ellipsis types out.
      title.style.setProperty('--punctuation-offset', `${offset}px`);
    });
    observer.observe(label);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={appRef} className="app" data-phase={isDying ? 'dying' : 'alive'}>
      <DitherBackground isDying={isDying} motion={motion} />
      <div className={`cinematic-overlay${isReady ? ' revealed' : ''}`} aria-hidden="true" />
      <FlowerScene isDying={isDying} motion={motion} onMotion={handleMotion} onPhaseChange={setIsDying} onReady={handleReady} />
      <div className="text-below" aria-hidden={isDying}>
        <h1 ref={titleRef} className="title">
          <DitherText
            asChild
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
        </h1>
      </div>
    </div>
  );
}

export default App;
