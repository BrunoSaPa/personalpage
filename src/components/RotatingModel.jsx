import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Center } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

const RotatingModel = () => {
    const modelRef = useRef();
    const { scene: gltfScene } = useGLTF('/assets/neonflower.glb');
    const lerpSpeed = 0.04; // Controla la velocidad de la interpolación

    // Mapa de colores de destino para cada child
    const colorMap = useRef({
        body001: { current: new THREE.Color(0x679436), target: new THREE.Color(0x679436), emissiveIntensity: 4 },
        boot001: { current: new THREE.Color(0x873f00), target: new THREE.Color(0x873f00), emissiveIntensity: 10 },
        head001: { current: new THREE.Color(0x873f00), target: new THREE.Color(0x873f00), emissiveIntensity: 10 },
        petal001: { current: new THREE.Color(0xFCBA04), target: new THREE.Color(0xFCBA04), emissiveIntensity: 2 },
        body002: { current: new THREE.Color(0x000000), target: new THREE.Color(0x000000), emissiveIntensity: 0 },
        boot002: { current: new THREE.Color(0x000000), target: new THREE.Color(0x000000), emissiveIntensity: 0 },
        petal002: { current: new THREE.Color(0x000000), target: new THREE.Color(0x000000), emissiveIntensity: 0 },
        head002: { current: new THREE.Color(0x000000), target: new THREE.Color(0x000000), emissiveIntensity: 0 }
    });

    useFrame(() => {
        if (modelRef.current) {
            // Rotar el modelo
            modelRef.current.rotation.y -= 0.02;

            // Convertir la rotación Y a grados
            const rotationYInDegrees = THREE.MathUtils.radToDeg(modelRef.current.rotation.y % (2 * Math.PI));

            // Normalizar a un rango de 0 a 360 grados
            const normalizedDegrees = (rotationYInDegrees + 360) % 360;

            // Detectar si está cerca de los rangos definidos
            const isNearZero = normalizedDegrees < 120 || normalizedDegrees > 240;

            // Ajustar colores y emissiveIntensity
            gltfScene.traverse((child) => {
                if (child.isMesh) {
                    const colorInfo = colorMap.current[child.name];

                    if (colorInfo) {
                        // Si está cerca de 0 o 360 grados, cambiar el color a gris y el emissiveIntensity a 0
                        const targetColor = isNearZero ? new THREE.Color(0x000000) : colorInfo.target;
                        const targetEmissiveIntensity = isNearZero ? 0.1 : colorInfo.emissiveIntensity;

                        // Interpolación de color y emissiveIntensity para cada mesh individualmente
                        colorInfo.current.lerp(targetColor, lerpSpeed);
                        child.material.emissive = colorInfo.current;
                        child.material.color = colorInfo.current;

                        // Suavizar la transición del emissiveIntensity
                        child.material.emissiveIntensity = THREE.MathUtils.lerp(child.material.emissiveIntensity, targetEmissiveIntensity, lerpSpeed);

                        child.material.needsUpdate = true;
                    }
                }
            });
        }
    });

    // Aplicar materiales emisivos
    useEffect(() => {
        gltfScene.traverse((child) => {
            if (child.isMesh) {
                if (['body002', 'boot002', 'petal002', 'head002'].includes(child.name)) {
                    // Estos son los meshes que deben ser opacos
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.color = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                    child.material.needsUpdate = true;
                }
                if (child.name === 'body001') {
                    colorMap.current.body001.target = new THREE.Color(0x679436);
                    child.material.emissive = colorMap.current.body001.target;
                    child.material.color = colorMap.current.body001.target;
                    child.material.emissiveIntensity = 4;
                    child.material.needsUpdate = true;
                }
                if (['boot001', 'head001'].includes(child.name)) {
                    colorMap.current.boot001.target = new THREE.Color(0x873f00);
                    child.material.emissive = colorMap.current.boot001.target;
                    child.material.color = colorMap.current.boot001.target;
                    child.material.emissiveIntensity = 10;
                    child.material.needsUpdate = true;
                }
                if (child.name === 'petal001') {
                    colorMap.current.petal001.target = new THREE.Color(0xFCBA04);
                    child.material.emissive = colorMap.current.petal001.target;
                    child.material.color = colorMap.current.petal001.target;
                    child.material.emissiveIntensity = 2;
                    child.material.needsUpdate = true;
                }
            }
        });
    }, [gltfScene]);

    return (
        <>
            <Center>
                <primitive ref={modelRef} object={gltfScene} scale={[0.7, 0.7, 0.7]} rotation={[0, Math.PI, 0]} />
            </Center>
            <EffectComposer>
                <Bloom intensity={1.0} luminanceThreshold={0.5} luminanceSmoothing={0.1} />
            </EffectComposer>
        </>
    );
};

export default RotatingModel;
