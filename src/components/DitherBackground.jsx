import PropTypes from 'prop-types';
import { DitherShader } from '../lib/dither';

// Sample all scenery on the original stationary 12px dot grid.
const LANDSCAPE = `
float terrainNoise(float x, float seed) {
  float cell = floor(x);
  float f = fract(x);
  f = mix(f, f * f * (3.0 - 2.0 * f), 0.55);
  return mix(hash21(vec2(cell, seed)), hash21(vec2(cell + 1.0, seed)), f);
}

float ridge(float x, float seed) {
  return terrainNoise(x, seed) * 0.58
    + terrainNoise(x * 2.13, seed + 7.0) * 0.28
    + terrainNoise(x * 4.37, seed + 13.0) * 0.14;
}

vec3 landscapeColor(vec2 uv, vec2 res, float t) {
  vec2 p = vec2(uv.x, 1.0 - uv.y);
  float aspect = res.x / res.y;
  float x = (p.x - 0.5) * aspect;
  float parallax = sin(turn);

  vec3 petrol = vec3(23.0, 52.0, 58.0) / 255.0;
  vec3 blue = vec3(36.0, 70.0, 80.0) / 255.0;
  vec3 slate = vec3(59.0, 91.0, 91.0) / 255.0;
  vec3 sky = mix(petrol * 0.4, blue, smoothstep(0.0, 0.64, p.y));
  sky = mix(sky, slate * 0.8, exp(-pow((p.y - 0.59) / 0.16, 2.0)) * 0.3);

  // White cloud banks stay soft at their edges, but read clearly against petrol.
  vec2 cloudPoint = vec2(x * 2.3 + parallax * 0.012 + t * 0.004, p.y * 8.0);
  float cloudShape = fbm(cloudPoint + vec2(6.0, 3.0));
  float wisps = smoothstep(0.3, 0.7, cloudShape);
  float cloudX = p.x + parallax * 0.004;
  float leftBank = exp(-pow((cloudX - 0.14) / 0.27, 2.0) - pow((p.y - 0.23) / 0.065, 2.0));
  float rightBank = exp(-pow((cloudX - 0.86) / 0.31, 2.0) - pow((p.y - 0.14) / 0.075, 2.0));
  float cloudBand = max(leftBank, rightBank);
  sky = mix(sky, vec3(1.0), wisps * cloudBand * 0.5);

  // Every range is black; transparency separates the distant silhouettes.
  float farRidge = 0.68 - ridge(x * 2.15 + parallax * 0.018 + 4.3, 12.0) * 0.25;
  float midRidge = 0.77 - ridge(x * 2.5 + parallax * 0.036 + 1.8, 37.0) * 0.25;
  float nearRidge = 0.86 - ridge(x * 2.8 + parallax * 0.06 + 8.0, 53.0) * 0.22;
  sky *= 1.0 - smoothstep(farRidge - 0.002, farRidge + 0.002, p.y) * 0.55;
  sky *= 1.0 - smoothstep(midRidge - 0.002, midRidge + 0.002, p.y) * 0.72;
  sky *= 1.0 - smoothstep(nearRidge - 0.001, nearRidge + 0.001, p.y);
  return sky;
}
`;

const GRID_FIELD = `${LANDSCAPE}
float field(vec2 uv, vec2 res, float t) {
  vec2 pixel = vec2(uv.x, 1.0 - uv.y) * res;
  vec2 grid = mod(pixel - res * 0.5 + 6.0, 12.0) - 6.0;
  float dotMask = 1.0 - smoothstep(2.0, 2.5, length(grid));
  vec2 noisePixel = mod(pixel + vec2(t * 12.8, 0.0), 256.0);
  float grain = hash21(floor(noisePixel));
  return dotMask * smoothstep(0.15, 0.95, grain) * 0.85;
}
`;

const COLOR_FIELD = `
vec3 colorField(vec2 uv, vec2 res, float t) {
  return landscapeColor(uv, res, t);
}
`;

function DitherBackground({ isDying, motion }) {
  return (
    <div className="dither-background" aria-hidden="true">
      <DitherShader
        field={GRID_FIELD}
        colorField={COLOR_FIELD}
        uniforms={motion.current}
        palette={['#000000', '#ffffff']}
        cell={1}
        matrix="blue-noise"
        animate={!isDying}
        fps={30}
      />
    </div>
  );
}

DitherBackground.propTypes = {
  isDying: PropTypes.bool.isRequired,
  motion: PropTypes.object.isRequired,
};

export default DitherBackground;
