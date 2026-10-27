import PropTypes from 'prop-types';
import { DitherShader } from '../lib/dither';

// The original 12px dot grid and its 256px noise mask moving over 20 seconds.
// The engine resolves the soft dot edges and moving tones into dither cells.
const FIELD = `
float field(vec2 uv, vec2 res, float t) {
  vec2 pixel = vec2(uv.x, 1.0 - uv.y) * res;
  vec2 grid = mod(pixel - res * 0.5 + 6.0, 12.0) - 6.0;
  float dotMask = 1.0 - smoothstep(2.0, 2.5, length(grid));
  vec2 noisePixel = mod(pixel + vec2(t * 12.8, 0.0), 256.0);
  float grain = hash21(floor(noisePixel));
  return dotMask * smoothstep(0.15, 0.95, grain) * 0.85;
}
`;

// Keep the original conic color placement, using the chosen deep petrol palette.
const COLOR_FIELD = `
vec3 colorField(vec2 uv, vec2 res, float t) {
  vec2 p = (vec2(uv.x, 1.0 - uv.y) - vec2(0.5, 0.2)) * res;
  float angle = mod(degrees(atan(p.x, -p.y)) + 180.0, 360.0);
  vec3 petrol = vec3(23.0, 52.0, 58.0) / 255.0;
  vec3 blue = vec3(36.0, 70.0, 80.0) / 255.0;
  vec3 slate = vec3(59.0, 91.0, 91.0) / 255.0;
  if (angle < 120.0) return mix(vec3(0.0), petrol, angle / 120.0);
  if (angle < 140.0) return mix(petrol, blue, (angle - 120.0) / 20.0);
  if (angle < 220.0) return blue;
  if (angle < 230.0) return mix(blue, slate, (angle - 220.0) / 10.0);
  return mix(slate, vec3(0.0), (angle - 230.0) / 130.0);
}
`;

function DitherBackground({ isDying }) {
  return (
    <div className="dither-background" aria-hidden="true">
      <DitherShader
        field={FIELD}
        colorField={COLOR_FIELD}
        palette={['#000000', '#ffffff']}
        cell={1}
        matrix="blue-noise"
        animate={!isDying}
        fps={30}
      />
    </div>
  );
}

DitherBackground.propTypes = { isDying: PropTypes.bool.isRequired };

export default DitherBackground;
