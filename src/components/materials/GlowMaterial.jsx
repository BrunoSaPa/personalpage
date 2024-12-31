import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

const GlowMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color('red'), emissiveIntensity: 0 },
  `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  varying vec3 vNormal;
  uniform vec3 color;
  uniform float emissiveIntensity;
  uniform float time;
  void main() {
    // Pulsación basada en el tiempo
    float pulse = sin(time * 2.0) * 0.5 + 0.5; 

    // Intensidad ajustada por normales
    float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.5)), 1.5);

    // Resultado final
    gl_FragColor = vec4(color * intensity * emissiveIntensity * pulse, 1.0);
  }
  `
);


export default GlowMaterial;
