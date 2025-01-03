import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Center } from '@react-three/drei';
import { Bloom, EffectComposer, Glitch, DotScreen, Scanline } from '@react-three/postprocessing';
import * as THREE from 'three';
import { GlitchMode, BlendFunction } from 'postprocessing'

const RotatingModel = ({isNearZero, setIsNearZero}) => {
    const modelRef = useRef();
    const { scene: gltfScene } = useGLTF('/assets/neonflower.glb');
    const lerpSpeed = 0.02;
    const [rotationSpeed, setRotationSpeed] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    const acceleration = 0.0008;
    const maxSpeed = 0.5;
    const [pulseIntensity, setPulseIntensity] = useState(0);
    const [isPulsating, setIsPulsating] = useState(false);
    //const [isNearZero, setIsNearZero] = useState(zero);

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

    const computeFinalIntensity = (child, targetIntensity) => {
        if (isNearZero) {
            if (child.name !== 'body002' && child.name !== 'boot002' && child.name !== 'petal002' && child.name !== 'head002') {
                return THREE.MathUtils.lerp(child.material.emissiveIntensity, 4, lerpSpeed);
            }
            return child.material.emissiveIntensity;
        } else {
            return THREE.MathUtils.lerp(child.material.emissiveIntensity, targetIntensity, lerpSpeed);
        }
    };

    useEffect(() => {
        const handleWheel = (event) => {
            event.preventDefault();

            const direction = event.deltaY || event.deltaX;

            const pcAcceleration = acceleration;
            setRotationSpeed((prevSpeed) => {
                const newSpeed = prevSpeed + direction * pcAcceleration;
                return THREE.MathUtils.clamp(newSpeed, -maxSpeed, maxSpeed);
            });
        };

        const handleTouchStart = (event) => {
            // Almacena la posición inicial del toque
            setTouchStartX(event.touches[0].clientX);
        };

        const handleTouchMove = (event) => {
            if (touchStartX === null) return;

            const touchEndX = event.touches[0].clientX;
            const direction = touchEndX > touchStartX ? -1 : 1; // Determina la dirección del swipe

            // Incrementa la velocidad con mayor sensibilidad para móviles
            const touchAcceleration = acceleration * 5; // Incrementa la sensibilidad en móviles
            setRotationSpeed((prevSpeed) => {
                const newSpeed = prevSpeed + direction * touchAcceleration;
                return THREE.MathUtils.clamp(newSpeed, -maxSpeed, maxSpeed);
            });

            setTouchStartX(touchEndX); // Actualiza la posición inicial para el siguiente movimiento
        };

        // Agregar eventos para scroll (PC) y táctiles (móviles)
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            // Eliminar los eventos al desmontar el componente
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [touchStartX]);

    useEffect(() => {
        // Randomized pulsation logic
        const triggerPulsation = () => {
            if (!isNearZero) {
                setIsPulsating(true);
                setTimeout(() => {
                    setIsPulsating(false);
                }, 2000); // Pulsate for 2 seconds
            }

            // Schedule next pulsation randomly between 2-7 seconds
            const delay = Math.random() * 5000 + 2000;
            setTimeout(triggerPulsation, delay);
        };

        triggerPulsation();
    }, [isNearZero]);

    useFrame((state) => {
        if (modelRef.current) {
            // Rotar el modelo
            //modelRef.current.rotation.y -= 0.02;

            modelRef.current.rotation.y += rotationSpeed;
            setRotationSpeed((prev) => THREE.MathUtils.lerp(prev, 0, 0.05));


            const time = state.clock.getElapsedTime();
            const sineWave = isPulsating ? Math.sin(time * 5) * 0.5 + 0.5 : 0;
            setPulseIntensity(sineWave);

            // Convertir la rotación Y a grados
            const rotationYInDegrees = THREE.MathUtils.radToDeg(modelRef.current.rotation.y % (2 * Math.PI));

            // Normalizar a un rango de 0 a 360 grados
            const normalizedDegrees = (rotationYInDegrees + 360) % 360;

            // Detectar si está cerca de los rangos definidos
            setIsNearZero(normalizedDegrees < 120 || normalizedDegrees > 240);



            // Ajustar colores y emissiveIntensity
            gltfScene.traverse((child) => {
                if (child.isMesh) {
                    const colorInfo = colorMap.current[child.name];

                    if (colorInfo) {
                        const targetIntensity = colorInfo.emissiveIntensity + pulseIntensity * 2;
                        const targetColor = isNearZero ? ((child.name != 'body002' && child.name != 'head002' && child.name != 'boot002' && child.name != 'petal002') ? new THREE.Color(0x9b9b9b) : colorInfo.target) : colorInfo.target;
                        const finalIntensity = computeFinalIntensity(child, targetIntensity);
                        colorInfo.current.lerp(targetColor, lerpSpeed);
                        child.material.emissive = colorInfo.current;
                        child.material.color = colorInfo.current;
                        child.material.emissiveIntensity = finalIntensity;
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
                <Bloom intensity={1} luminanceThreshold={.4} luminanceSmoothing={0.2} />
                {isNearZero && <Glitch
                    delay={[0, .3]} // min and max glitch delay
                    duration={[1, 3.0]} // min and max glitch duration
                    strength={[2, 20]} // min and max glitch strength
                    mode={GlitchMode.SPORADIC} // glitch mode
                    ratio={0.85} // Threshold for strong glitches, 0 - no weak glitches, 1 - no strong glitches.
                />}

                <Scanline
                    blendFunction={BlendFunction.OVERLAY} // blend mode
                    density={2} // scanline density
                />

            </EffectComposer>
        </>
    );
};

export default RotatingModel;
