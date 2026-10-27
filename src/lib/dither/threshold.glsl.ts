/** Shared by DitherShader and the live Three.js image adapter. */
export const DITHER_THRESHOLD_GLSL = `
float ditherThreshold(vec2 cell, sampler2D thresholds, float matrixSize, float rankStep) {
  vec2 at = (mod(cell, matrixSize) + 0.5) / matrixSize;
  float stored = floor(texture2D(thresholds, at).r * 255.0 + 0.5);
  return (stored + 0.5 * rankStep) / 256.0;
}

float ditherTone(float tone, float levels) {
  float steps = levels - 1.0;
  return floor(clamp(tone, 0.0, 1.0) * steps + 0.5) / steps;
}
`;
