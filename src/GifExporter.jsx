import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import { Bloom, EffectComposer, Scanline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import GIF from 'gif.js';
import JSZip from 'jszip';

// Import the worker from node_modules for proper bundling
const workerPath = '/gif.worker.js';

const ExportableModel = ({ currentFrame, frameCount, isCapturing }) => {
    const modelRef = useRef();
    const { scene: gltfScene } = useGLTF('/assets/neonflower.glb');

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

    // Apply materials on load
    useEffect(() => {
        gltfScene.traverse((child) => {
            if (child.isMesh) {
                if (['body002', 'boot002', 'petal002', 'head002'].includes(child.name)) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.color = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                    child.material.needsUpdate = true;
                }
                if (child.name === 'body001') {
                    child.material.emissive = new THREE.Color(0x679436);
                    child.material.color = new THREE.Color(0x679436);
                    child.material.emissiveIntensity = 4;
                    child.material.needsUpdate = true;
                }
                if (['boot001', 'head001'].includes(child.name)) {
                    child.material.emissive = new THREE.Color(0x873f00);
                    child.material.color = new THREE.Color(0x873f00);
                    child.material.emissiveIntensity = 10;
                    child.material.needsUpdate = true;
                }
                if (child.name === 'petal001') {
                    child.material.emissive = new THREE.Color(0xFCBA04);
                    child.material.color = new THREE.Color(0xFCBA04);
                    child.material.emissiveIntensity = 2;
                    child.material.needsUpdate = true;
                }
            }
        });
    }, [gltfScene]);

    // Update rotation based on current frame during capture
    useEffect(() => {
        if (modelRef.current && isCapturing) {
            const rotationPerFrame = (2 * Math.PI) / frameCount;
            modelRef.current.rotation.y = Math.PI + (currentFrame * rotationPerFrame);
        }
    }, [currentFrame, frameCount, isCapturing]);

    return (
        <Center>
            <primitive ref={modelRef} object={gltfScene} scale={[0.7, 0.7, 0.7]} rotation={[0, Math.PI, 0]} />
        </Center>
    );
};

const FrameCapturer = ({ onCapture, currentFrame, shouldCapture, outputSize = 1024 }) => {
    const { gl } = useThree();
    const frameRef = useRef(-1);
    const waitFrames = useRef(0);

    useFrame(() => {
        if (shouldCapture && frameRef.current !== currentFrame) {
            frameRef.current = currentFrame;
            waitFrames.current = 0;
        }

        // Wait 2 frames after rotation change to ensure post-processing effects are rendered
        if (shouldCapture && frameRef.current === currentFrame) {
            waitFrames.current++;

            if (waitFrames.current === 3) {
                // The scene has already been rendered with effects by the EffectComposer
                // Just capture what's on the canvas
                const sourceCanvas = gl.domElement;
                const targetCanvas = document.createElement('canvas');
                targetCanvas.width = outputSize;
                targetCanvas.height = outputSize;
                const ctx = targetCanvas.getContext('2d');

                // Use high quality image scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw the source canvas scaled to target size
                ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, outputSize, outputSize);

                const dataUrl = targetCanvas.toDataURL('image/png', 1.0);
                onCapture(dataUrl, currentFrame);
            }
        }
    });

    return null;
};


// Main export component with UI
const GifExporter = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [frameCount, setFrameCount] = useState(60);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [frames, setFrames] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, capturing, processing, complete
    const [progress, setProgress] = useState(0);
    const [exportFormat, setExportFormat] = useState('gif'); // gif, png-transparent, png-glow
    const [backgroundMode, setBackgroundMode] = useState('glow'); // 'transparent' or 'glow'

    const handleFrameCapture = useCallback((dataUrl, frameIndex) => {
        setFrames(prev => {
            const newFrames = [...prev];
            newFrames[frameIndex] = dataUrl;
            return newFrames;
        });

        setProgress(Math.round(((frameIndex + 1) / frameCount) * 50)); // First 50% is capturing

        if (frameIndex < frameCount - 1) {
            setTimeout(() => setCurrentFrame(frameIndex + 1), 50); // Small delay for render
        } else {
            setStatus('processing');
        }
    }, [frameCount]);

    const startExport = useCallback(() => {
        setIsExporting(true);
        setFrames([]);
        setCurrentFrame(0);
        setStatus('capturing');
        setProgress(0);
    }, []);

    // Process frames into GIF when capturing is done
    useEffect(() => {
        if (status === 'processing' && frames.length === frameCount && frames.every(f => f)) {
            if (exportFormat === 'gif') {
                // Create GIF
                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    width: 512,
                    height: 512,
                    transparent: 0x000000,
                    workerScript: workerPath
                });

                let loadedCount = 0;
                const images = [];

                frames.forEach((dataUrl, index) => {
                    const img = new Image();
                    img.onload = () => {
                        images[index] = img;
                        loadedCount++;

                        if (loadedCount === frameCount) {
                            images.forEach((img) => {
                                gif.addFrame(img, { delay: 33, transparent: 0x000000 });
                            });

                            gif.on('progress', (p) => {
                                setProgress(50 + Math.round(p * 50));
                            });

                            gif.on('finished', (blob) => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'rotating_model.gif';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                setStatus('complete');
                                setIsExporting(false);
                                setProgress(100);
                            });

                            gif.render();
                        }
                    };
                    img.src = dataUrl;
                });
            } else {
                // Export as ZIP of PNGs (either transparent or with glow)
                setProgress(60);

                const zip = new JSZip();
                const folderName = exportFormat === 'png-transparent' ? 'frames_transparent' : 'frames_with_glow';
                const folder = zip.folder(folderName);

                // Convert base64 data URLs to blobs and add to zip
                frames.forEach((dataUrl, index) => {
                    // Extract base64 data from data URL
                    const base64Data = dataUrl.split(',')[1];
                    folder.file(`frame_${String(index).padStart(3, '0')}.png`, base64Data, { base64: true });
                    setProgress(60 + Math.round((index / frames.length) * 30));
                });

                // Generate and download the zip
                const zipFilename = exportFormat === 'png-transparent'
                    ? 'rotating_model_transparent.zip'
                    : 'rotating_model_with_glow.zip';
                zip.generateAsync({ type: 'blob' }).then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = zipFilename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    setStatus('complete');
                    setIsExporting(false);
                    setProgress(100);
                });
            }
        }
    }, [status, frames, frameCount, exportFormat]);

    const resetExport = useCallback(() => {
        setStatus('idle');
        setProgress(0);
        setFrames([]);
        setCurrentFrame(0);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{
                padding: '20px',
                color: 'white',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                zIndex: 10,
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <label>
                    Frames:
                    <input
                        type="number"
                        value={frameCount}
                        onChange={(e) => setFrameCount(Math.max(10, parseInt(e.target.value) || 60))}
                        style={{ marginLeft: '10px', width: '60px' }}
                        disabled={isExporting}
                    />
                </label>
                <label>
                    Format:
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        style={{ marginLeft: '10px' }}
                        disabled={isExporting}
                    >
                        <option value="gif">GIF (with glow, black bg)</option>
                        <option value="png-glow">PNG Frames (with glow, black bg)</option>
                        <option value="png-transparent">PNG Frames (transparent, no outer glow)</option>
                    </select>
                </label>
                {status === 'complete' ? (
                    <button
                        onClick={resetExport}
                        style={{
                            padding: '10px 20px',
                            background: '#4a90d9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Export Another
                    </button>
                ) : (
                    <button
                        onClick={startExport}
                        disabled={isExporting}
                        style={{
                            padding: '10px 20px',
                            background: isExporting ? '#555' : '#679436',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isExporting ? `Exporting... ${progress}%` : 'Export GIF'}
                    </button>
                )}
            </div>

            <div style={{
                width: '512px',
                height: '512px',
                position: 'relative',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <Canvas
                    camera={{ position: [0, 0, 4.5], fov: 55 }}
                    gl={{
                        preserveDrawingBuffer: true,
                        alpha: true,
                        antialias: true,
                        premultipliedAlpha: false
                    }}
                    style={{ background: 'transparent' }}
                    onCreated={({ gl }) => {
                        // Set transparent or black based on export format
                        const useTransparent = exportFormat === 'png-transparent';
                        gl.setClearColor(0x000000, useTransparent ? 0 : 1);
                    }}
                    key={exportFormat} // Force re-create canvas when format changes
                >
                    {exportFormat !== 'png-transparent' && (
                        <color attach="background" args={['#000000']} />
                    )}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <ExportableModel
                        isCapturing={status === 'capturing'}
                        frameCount={frameCount}
                        currentFrame={currentFrame}
                    />
                    {status === 'capturing' && (
                        <FrameCapturer
                            onCapture={handleFrameCapture}
                            currentFrame={currentFrame}
                            shouldCapture={true}
                        />
                    )}
                    <EffectComposer multisampling={0}>
                        <Bloom intensity={1} luminanceThreshold={0.4} luminanceSmoothing={0.2} />
                        <Scanline
                            blendFunction={BlendFunction.OVERLAY}
                            density={2}
                        />
                    </EffectComposer>
                </Canvas>
            </div>

            <div style={{ color: '#888', marginTop: '20px', textAlign: 'center', maxWidth: '500px' }}>
                <p><strong>GIF format:</strong> Has a black background (GIF doesn't support proper transparency with gradients/glow effects)</p>
                <p><strong>PNG Frames:</strong> Exports individual transparent PNG files that you can combine into APNG/WebP using tools like EZGIF</p>
            </div>
        </div>
    );
};

export default GifExporter;
