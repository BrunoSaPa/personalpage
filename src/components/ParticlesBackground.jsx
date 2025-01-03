import React, { useCallback, useState, useEffect } from "react";
import { Particles } from "react-tsparticles";
import { loadFull } from "tsparticles";

const ParticlesBackground = ({ isNearZero }) => {
  const [particleSpeed, setParticleSpeed] = useState(4);
  const [linksOpacity, setLinksOpacity] = useState(0.4);

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  useEffect(() => {
    const targetSpeed = isNearZero ? 0 : 4;
    const targetOpacity = isNearZero ? 0 : 0.4;
    const interval = 16; // ~60fps
    const step = 0.1;

    const updateValues = () => {
      setParticleSpeed(prevSpeed => {
        if (Math.abs(prevSpeed - targetSpeed) < step) return targetSpeed;
        return prevSpeed + (targetSpeed > prevSpeed ? step : -step);
      });

      setLinksOpacity(prevOpacity => {
        if (Math.abs(prevOpacity - targetOpacity) < 0.01) return targetOpacity;
        return prevOpacity + (targetOpacity > prevOpacity ? 0.01 : -0.01);
      });
    };

    const timer = setInterval(updateValues, interval);
    return () => clearInterval(timer);
  }, [isNearZero]);

  const particlesOptions = {
    smooth: true,
    pauseOnOutsideViewport: true,
    fullScreen: {
      enable: true,
      zIndex: 0,
    },
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800,
        },
      },
      links: {
        enable: true,
        color: "#E3E4DB",
        distance: 150,
        opacity: linksOpacity,
      },
      color: {
        value: ["#E3E4DB"],
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: 0.5,
        random: true,
      },
      size: {
        value: 3,
        random: true,
      },
      move: {
        enable: true,
        speed: particleSpeed,
        direction: "none",
        random: false,
        straight: false,
        attract: {
          enable: true,
          rotateX: 800,
          rotateY: 1600,
        },
        outModes: {
          default: "out",
        },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse",
        },
        onClick: {
          enable: true,
          mode: "push",
        },
      },
      modes: {
        attract: {
          distance: 100,
          duration: 0.4,
        },
        push: {
          quantity: 1,
          distance: 1,
        },
        repulse: {
          distance: 100,
        }
      },
    },
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={particlesOptions}
    />
  );
};

export default ParticlesBackground;