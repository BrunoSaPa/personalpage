import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { BlendFunction, Effect, EffectAttribute, GlitchEffect, GlitchMode } from 'postprocessing';
import { DataTexture, NearestFilter, RedFormat, Uniform, Vector2 } from 'three';
import { encodeThresholdMap, getThresholdMap } from '../lib/dither/matrices';
import { DITHER_THRESHOLD_GLSL } from '../lib/dither/threshold.glsl';
import { usePrefersReducedMotion } from '../lib/dither/motion';

const FRAGMENT = `
uniform sampler2D thresholds;
uniform float matrixSize;
uniform float rankStep;
uniform float levels;
uniform float cellSize;
uniform vec2 renderSize;
uniform float amount;
${DITHER_THRESHOLD_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 displayColor = pow(clamp(inputColor.rgb, 0.0, 1.0), vec3(1.0 / 2.2));
  float brightness = max(max(displayColor.r, displayColor.g), displayColor.b);
  float tone = ditherTone(brightness, levels);
  vec2 cell = floor(uv * renderSize / cellSize);
  float threshold = ditherThreshold(cell, thresholds, matrixSize, rankStep);
  float ink = step(threshold, tone);
  vec3 inkColor = displayColor / max(brightness, 0.0001);
  // Convert back to linear light for the composer's display conversion.
  vec3 dithered = pow(inkColor, vec3(2.2)) * ink;
  // Crossfade the texture over the original solid surface rather than switching passes.
  // Bloom's alpha carries the live, softly blurred silhouette. Extra black
  // coverage follows the animated geometry without changing its RGB or glow.
  float silhouette = clamp(inputColor.a, 0.0, 1.0);
  float halo = 1.0 - pow(1.0 - silhouette, 4.0);
  float coverage = mix(silhouette, halo, amount);
  outputColor = vec4(mix(inputColor.rgb, dithered, amount), coverage);
}
`;

class DitherImageEffect extends Effect {
  constructor() {
    const map = getThresholdMap('blue-noise');
    const { bytes, rankStep } = encodeThresholdMap(map);
    const texture = new DataTexture(bytes, map.size, map.size, RedFormat);
    texture.minFilter = texture.magFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    super('DitherImageEffect', FRAGMENT, {
      blendFunction: BlendFunction.NORMAL,
      // A separate pass places the shared dither engine after bloom and glitch.
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ['thresholds', new Uniform(texture)],
        ['matrixSize', new Uniform(map.size)],
        ['rankStep', new Uniform(rankStep)],
        ['levels', new Uniform(map.steps + 1)],
        ['cellSize', new Uniform(1)],
        ['renderSize', new Uniform(new Vector2())],
        ['amount', new Uniform(1)],
      ]),
    });
    this.thresholdTexture = texture;
  }

  setSize(width, height) {
    this.uniforms.get('renderSize').value.set(width, height);
  }

  update(renderer) {
    // About one CSS pixel per cell keeps the small petals and silhouette intact.
    this.uniforms.get('cellSize').value = Math.max(1, Math.round(renderer.getPixelRatio() * 1.25));
  }

  dispose() {
    this.thresholdTexture.dispose();
    super.dispose();
  }
}

class FlowerGlitchEffect extends GlitchEffect {
  constructor() {
    super({ delay: new Vector2(0, 0.3), duration: new Vector2(1, 3), strength: new Vector2(2, 20), ratio: 0.85 });
    this.mode = GlitchMode.DISABLED;
  }

  update(renderer, inputBuffer, delta) {
    // The original component recreated this effect on every animation frame.
    // Preserve its short trigger window without reallocating shaders and noise maps.
    this.time = 0;
    this.breakPoint.x = Math.random() * 0.3;
    super.update(renderer, inputBuffer, delta);
  }
}

function FlowerEffects({ isDying, motion }) {
  const reducedMotion = usePrefersReducedMotion();
  const dither = useMemo(() => new DitherImageEffect(), []);
  const glitch = useMemo(() => new FlowerGlitchEffect(), []);
  const bloom = useRef(null);

  useFrame(() => {
    const life = motion.current.life;
    dither.uniforms.get('amount').value = life;
    if (bloom.current) bloom.current.intensity = 0.3 * life * life;
    glitch.blendMode.opacity.value = 1 - life;
  });

  useEffect(() => {
    glitch.mode = isDying && !reducedMotion ? GlitchMode.SPORADIC : GlitchMode.DISABLED;
  }, [glitch, isDying, reducedMotion]);

  useEffect(() => () => {
    dither.dispose();
    glitch.dispose();
  }, [dither, glitch]);

  return (
    <EffectComposer multisampling={4}>
      {/* Include the darker stem and boot in the same glow pass as the petals. */}
      <Bloom ref={bloom} intensity={0.3} luminancePass-enabled={false} />
      <primitive object={glitch} />
      <primitive object={dither} />
    </EffectComposer>
  );
}

FlowerEffects.propTypes = { isDying: PropTypes.bool.isRequired, motion: PropTypes.object.isRequired };

export default FlowerEffects;
