import { Suspense } from 'react';
import PropTypes from 'prop-types';
import { Canvas } from '@react-three/fiber';
import RotatingModel from './RotatingModel';

function FlowerScene({ isDying, motion, onMotion, onPhaseChange, onReady }) {
  return (
    <main
      className="flower-scene"
      role="img"
      aria-label="An interactive flower. Scroll, drag, or use the arrow keys to turn it. Facing forward, it comes alive in color; turned away, its head droops as it fades to solid white and occasionally glitches."
      tabIndex={0}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        fallback={<p className="webgl-message">The flower needs a browser with WebGL.</p>}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[-3, 5, 6]} intensity={2.5} />
        <directionalLight position={[4, -1, -3]} intensity={0.65} />
        <Suspense fallback={null}>
          <RotatingModel isDying={isDying} motion={motion} onMotion={onMotion} onPhaseChange={onPhaseChange} onReady={onReady} />
        </Suspense>
      </Canvas>
    </main>
  );
}

FlowerScene.propTypes = {
  isDying: PropTypes.bool.isRequired,
  motion: PropTypes.object.isRequired,
  onMotion: PropTypes.func.isRequired,
  onPhaseChange: PropTypes.func.isRequired,
  onReady: PropTypes.func.isRequired,
};

export default FlowerScene;
