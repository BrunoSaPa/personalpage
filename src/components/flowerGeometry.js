import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function smoothFlowerGeometry(source) {
  // The untextured source repeats vertices for flat face normals. Share those
  // positions so lighting and animated petal normals flow across the surface.
  const positions = source.clone();
  positions.deleteAttribute('normal');
  positions.deleteAttribute('uv');
  const geometry = mergeVertices(positions, 0.00001);
  positions.dispose();
  geometry.computeVertexNormals();
  return geometry;
}
