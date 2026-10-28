import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import { Color, DoubleSide, MathUtils, MeshStandardMaterial } from 'three';
import FlowerEffects from './FlowerEffects';
import { usePrefersReducedMotion } from '../lib/dither/motion';
import { advanceFlowerPose, createFlowerRig, flowerOpticalCenter } from './flowerRig';
import { smoothFlowerGeometry } from './flowerGeometry';

const materials = {
  body001: { color: '#679436', intensity: 4 },
  boot001: { color: '#873f00', intensity: 10 },
  head001: { color: '#873f00', intensity: 10 },
  petal001: { color: '#FCBA04', intensity: 2 },
};
const dyingColor = new Color('#ffffff');

function RotatingModel({ isDying, motion, onMotion, onPhaseChange, onReady }) {
  const { scene } = useGLTF('/assets/neonflower.glb');
  const modelRef = useRef(null);
  const speedRef = useRef(0);
  const phaseRef = useRef(false);
  const lifeRef = useRef(1);
  const poseRef = useRef({ droop: 0, velocity: 0, petals: 0, petalVelocity: 0 });
  const pointerRef = useRef(null);
  const pulseRef = useRef({ start: -10, next: 2 + Math.random() * 5 });
  const reducedMotion = usePrefersReducedMotion();

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      // Keep the original solid geometry; its separate wire cage is no longer drawn.
      child.visible = child.name.endsWith('002');
      if (!child.visible) return;
      const settings = materials[child.name.replace(/002$/, '001')];
      child.geometry = smoothFlowerGeometry(child.geometry);
      child.material = new MeshStandardMaterial({
        color: settings.color,
        emissive: settings.color,
        emissiveIntensity: settings.intensity * 0.035,
        roughness: 0.85,
        metalness: 0,
        side: DoubleSide,
      });
      child.userData.aliveColor = new Color(settings.color);
    });
    return clone;
  }, [scene]);
  const { rig, opticalX } = useMemo(() => ({
    rig: createFlowerRig(model),
    opticalX: flowerOpticalCenter(model) * 0.78,
  }), [model]);

  useEffect(() => {
    onReady();
    return () => model.traverse((child) => {
      if (child.isMesh && child.visible) {
        child.material.dispose();
        child.geometry.dispose();
      }
    });
  }, [model, onReady]);

  useEffect(() => {
    const accelerate = (amount) => {
      speedRef.current = MathUtils.clamp(speedRef.current + amount, -0.5, 0.5);
    };
    const handleWheel = (event) => {
      event.preventDefault();
      accelerate((event.deltaY || event.deltaX) * 0.0008);
    };
    const handlePointerDown = (event) => {
      if (event.button !== 0) return;
      pointerRef.current = { id: event.pointerId, x: event.clientX, type: event.pointerType };
    };
    const handlePointerMove = (event) => {
      const pointer = pointerRef.current;
      if (!pointer || pointer.id !== event.pointerId) return;
      event.preventDefault();
      accelerate(-(event.clientX - pointer.x) * (pointer.type === 'touch' ? 0.004 : 0.0015));
      pointer.x = event.clientX;
    };
    const stopPointer = () => { pointerRef.current = null; };
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        accelerate(event.key === 'ArrowRight' ? 0.035 : -0.035);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', stopPointer);
    window.addEventListener('pointercancel', stopPointer);
    window.addEventListener('blur', stopPointer);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopPointer);
      window.removeEventListener('pointercancel', stopPointer);
      window.removeEventListener('blur', stopPointer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useFrame((state, delta) => {
    if (!modelRef.current) return;
    const frameScale = Math.min(delta * 60, 3);
    modelRef.current.rotation.y += speedRef.current * frameScale;
    speedRef.current *= Math.pow(0.98, frameScale);
    if (Math.abs(speedRef.current) < 0.00001) speedRef.current = 0;

    const degrees = MathUtils.euclideanModulo(MathUtils.radToDeg(modelRef.current.rotation.y), 360);
    const dying = degrees < 120 || degrees > 240;
    if (phaseRef.current !== dying) {
      phaseRef.current = dying;
      onPhaseChange(dying);
    }

    const targetLife = dying ? 0 : 1;
    let life = MathUtils.damp(lifeRef.current, targetLife, reducedMotion ? 8 : 2.2, Math.min(delta, 0.05));
    if (Math.abs(life - targetLife) < 0.002) life = targetLife;
    lifeRef.current = life;
    advanceFlowerPose(poseRef.current, dying ? 1 : 0, Math.min(delta, 0.05), reducedMotion);
    rig.update(poseRef.current.droop, poseRef.current.petals);
    onMotion(modelRef.current.rotation.y - Math.PI, life);

    const time = state.clock.elapsedTime;
    const pulse = pulseRef.current;
    if (!dying && time > pulse.next) {
      pulse.start = time;
      pulse.next = time + 2 + 2 + Math.random() * 5;
    }
    const pulsating = !dying && !reducedMotion && time - pulse.start < 2;
    const intensity = pulsating ? Math.sin(time * 5) * 0.5 + 0.5 : 0;

    model.traverse((child) => {
      if (!child.isMesh || !child.visible) return;
      const settings = materials[child.name.replace(/002$/, '001')];
      if (!settings) return;
      child.material.emissive.copy(dyingColor).lerp(child.userData.aliveColor, life);
      child.material.color.copy(child.material.emissive);
      child.material.emissiveIntensity = MathUtils.lerp(
        0.12,
        settings.intensity * 0.035 + intensity * 0.06,
        life,
      );
    });
  });

  return (
    <>
      {/* Front-facing rotation mirrors x, so this offset balances its visual mass at zero. */}
      <group position={[opticalX, -0.12, 0]}>
        <Center precise disableX>
          <primitive ref={modelRef} object={model} scale={0.78} rotation={[0, Math.PI, 0]} dispose={null} />
        </Center>
      </group>
      <FlowerEffects isDying={isDying} motion={motion} />
    </>
  );
}

RotatingModel.propTypes = {
  isDying: PropTypes.bool.isRequired,
  motion: PropTypes.object.isRequired,
  onMotion: PropTypes.func.isRequired,
  onPhaseChange: PropTypes.func.isRequired,
  onReady: PropTypes.func.isRequired,
};

export default RotatingModel;
