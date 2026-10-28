import { DynamicDrawUsage, MathUtils, Vector3 } from 'three';

const BEND_START = 0.7;
const BEND_END = 2.05;
const BEND_LENGTH = BEND_END - BEND_START;
const MAX_BEND = -0.46;
const HEAD_CENTER_Y = 2.2593326568603516;

function settleSpring(position, velocity, target, delta, frequency) {
  const offset = position - target;
  const decay = Math.exp(-frequency * delta);
  const step = (velocity + frequency * offset) * delta;
  const next = target + (offset + step) * decay;
  const nextVelocity = (velocity - frequency * step) * decay;
  return Math.abs(next - target) < 0.00025 && Math.abs(nextVelocity) < 0.00025
    ? [target, 0]
    : [next, nextVelocity];
}

export function advanceFlowerPose(pose, target, delta, reducedMotion = false) {
  // A critically damped neck starts and stops gently, even when rotation reverses.
  [pose.droop, pose.velocity] = settleSpring(pose.droop, pose.velocity, target, delta, reducedMotion ? 7 : 1.15);
  [pose.petals, pose.petalVelocity] = settleSpring(pose.petals, pose.petalVelocity, pose.droop, delta, reducedMotion ? 9 : 3);
}

export function gravityPetalPoint(x, y, z, amount, headAmount = amount) {
  const height = y - HEAD_CENTER_Y;
  const radius = Math.hypot(x, height);
  const tip = Math.pow(MathUtils.smoothstep(radius, 0.54, 1.31), 2);
  const lowerPetal = MathUtils.smoothstep(-height, 0.2, 0.8);
  const variation = 0.92 + 0.08 * Math.sin(Math.atan2(height, x) * 5 + 0.8);
  // Keep the attachment fixed. Only the tips hang and curl slightly forward;
  // the lower petals get more clearance from the stem as the neck bows.
  return [
    y - tip * (0.022 + amount * 0.028) * variation,
    z - tip * (0.022 + amount * 0.035 + headAmount * lowerPetal * 0.045) * variation,
  ];
}

export function flowerOpticalCenter(model) {
  // Balance visible, bright surface area rather than the boot's bounding box.
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let total = 0;
  let center = 0;
  model.updateMatrixWorld(true);
  model.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.visible) return;
    const { position } = mesh.geometry.attributes;
    const indices = mesh.geometry.index;
    const { r, g, b: blue } = mesh.material.color;
    const brightness = r * 0.2126 + g * 0.7152 + blue * 0.0722;
    for (let i = 0; i < indices.count; i += 3) {
      a.fromBufferAttribute(position, indices.getX(i)).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(position, indices.getX(i + 1)).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(position, indices.getX(i + 2)).applyMatrix4(mesh.matrixWorld);
      const weight = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * brightness;
      total += weight;
      center += (a.x + b.x + c.x) / 3 * weight;
    }
  });
  return center / total;
}

// Bend the neck along an arc; the whole flower head follows its end rigidly.
// Coordinates are in the original model's shared parent space.
export function bendFlowerPoint(y, z, amount, rigidHead = false) {
  if (amount < 0.00001 || (!rigidHead && y <= BEND_START)) return [y, z, 0];
  const distance = rigidHead ? BEND_LENGTH : Math.min(y - BEND_START, BEND_LENGTH);
  const curvature = MAX_BEND * amount / BEND_LENGTH;
  const angle = distance * curvature;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rest = y - BEND_START - distance;
  return [
    BEND_START + sine / curvature + rest * cosine - z * sine,
    (1 - cosine) / curvature + rest * sine + z * cosine,
    angle,
  ];
}

export function createFlowerRig(model) {
  const parts = [];
  model.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.visible || mesh.name === 'boot002') return;
    // Bake each part's original transform once so the stem and head share a neck.
    mesh.updateMatrix();
    mesh.geometry.applyMatrix4(mesh.matrix);
    if (mesh.matrix.determinant() < 0) {
      const indices = mesh.geometry.index;
      for (let i = 0; i < indices.count; i += 3) {
        const second = indices.getX(i + 1);
        indices.setX(i + 1, indices.getX(i + 2));
        indices.setX(i + 2, second);
      }
    }
    mesh.position.set(0, 0, 0);
    mesh.quaternion.identity();
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();
    const position = mesh.geometry.attributes.position;
    const normal = mesh.geometry.attributes.normal;
    position.setUsage(DynamicDrawUsage);
    normal.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    parts.push({
      geometry: mesh.geometry, position, normal,
      restPosition: position.array.slice(),
      restNormal: normal.array.slice(),
      rigidHead: mesh.name === 'head002' || mesh.name === 'petal002',
      isPetal: mesh.name === 'petal002',
    });
  });

  let previous = -1;
  let previousPetals = -1;
  return {
    update(amount, petalAmount = amount) {
      if (Math.abs(previous - amount) < 0.00001 && Math.abs(previousPetals - petalAmount) < 0.00001) return;
      previous = amount;
      previousPetals = petalAmount;
      for (const part of parts) {
        const { position, normal, restPosition, restNormal, rigidHead, isPetal } = part;
        for (let i = 0; i < position.count; i++) {
          const at = i * 3;
          const [restY, restZ] = isPetal
            ? gravityPetalPoint(restPosition[at], restPosition[at + 1], restPosition[at + 2], petalAmount, amount)
            : [restPosition[at + 1], restPosition[at + 2]];
          const [y, z, angle] = bendFlowerPoint(restY, restZ, amount, rigidHead);
          position.array[at + 1] = y;
          position.array[at + 2] = z;
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          normal.array[at + 1] = restNormal[at + 1] * cosine - restNormal[at + 2] * sine;
          normal.array[at + 2] = restNormal[at + 1] * sine + restNormal[at + 2] * cosine;
        }
        position.needsUpdate = normal.needsUpdate = true;
        if (isPetal) part.geometry.computeVertexNormals();
      }
    },
  };
}
