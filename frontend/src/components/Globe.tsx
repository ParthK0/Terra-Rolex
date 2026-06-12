import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  status: 'thriving' | 'healthy' | 'threatened' | 'degraded';
}

function LivingEarth({ status }: GlobeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  // Rotate the globe slowly
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.05;
      meshRef.current.rotation.x = Math.sin(time * 0.02) * 0.1;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -time * 0.03;
    }
  });

  // Map status to colors
  const statusColors = {
    thriving: {
      core: '#059669',     // emerald 600
      wire: '#34d399',     // emerald 400
      emissive: '#022c22'  // deep emerald
    },
    healthy: {
      core: '#0284c7',     // sky 600
      wire: '#38bdf8',     // sky 400
      emissive: '#0c4a6e'  // deep sky
    },
    threatened: {
      core: '#d97706',     // amber 600
      wire: '#fbbf24',     // amber 400
      emissive: '#451a03'  // deep amber
    },
    degraded: {
      core: '#4b5563',     // grey 600
      wire: '#f87171',     // red 400
      emissive: '#111827'  // charcoal dark
    }
  };

  const colors = statusColors[status] || statusColors.healthy;

  return (
    <group>
      {/* Core Solid Globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshStandardMaterial
          color={colors.core}
          emissive={colors.emissive}
          roughness={0.8}
          metalness={0.2}
          flatShading
        />
      </mesh>

      {/* Futuristic Wireframe Grid */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.82, 24, 24]} />
        <meshBasicMaterial
          color={colors.wire}
          wireframe
          transparent
          opacity={status === 'degraded' ? 0.15 : 0.4}
        />
      </mesh>
    </group>
  );
}

function AtmosphereParticles({ status }: GlobeProps) {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.02;
      pointsRef.current.rotation.z = Math.cos(time * 0.01) * 0.1;
    }
  });

  // Number of particles and distribution
  const count = status === 'degraded' ? 600 : status === 'threatened' ? 400 : 250;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute particles in a shell around the globe
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.0 + Math.random() * 0.8; // shell radius from 2.0 to 2.8

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const pColor = {
    thriving: '#10b981',  // green spark
    healthy: '#06b6d4',   // cyan spark
    threatened: '#f59e0b', // amber smog
    degraded: '#ef4444'    // crimson ashes
  }[status];

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={pColor}
        size={status === 'degraded' ? 0.06 : 0.04}
        sizeAttenuation
        transparent
        opacity={status === 'degraded' ? 0.7 : 0.5}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Globe({ status }: GlobeProps) {
  return (
    <div className="relative w-full h-[320px] md:h-[400px] flex items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-b from-gray-950/20 to-gray-950/80 border border-white/5">
      {/* Overlay Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Living Environment</span>
        <div className="flex items-center gap-2 mt-1">
          <span className={`h-2.5 w-2.5 rounded-full ${
            status === 'thriving' ? 'bg-emerald-400 animate-pulse' :
            status === 'healthy' ? 'bg-cyan-400 animate-pulse' :
            status === 'threatened' ? 'bg-amber-400' : 'bg-red-500 animate-ping'
          }`} />
          <span className={`text-sm font-bold uppercase tracking-wider ${
            status === 'thriving' ? 'text-emerald-400' :
            status === 'healthy' ? 'text-cyan-400' :
            status === 'threatened' ? 'text-amber-400' : 'text-red-400'
          }`}>
            {status}
          </span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }} className="w-full h-full cursor-grab active:cursor-grabbing">
        <ambientLight intensity={status === 'degraded' ? 0.2 : 0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={status === 'degraded' ? '#ef4444' : '#ffffff'} />
        
        <LivingEarth status={status} />
        <AtmosphereParticles status={status} />
        
        <OrbitControls 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
          enablePan={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      {/* Floating status comment */}
      <div className="absolute bottom-4 right-4 z-10 glass-card px-4 py-2 border border-white/5 max-w-[200px]">
        <p className="text-[11px] text-gray-400 text-right italic leading-snug">
          {status === 'thriving' && 'Forests are lush, air quality index is pristine.'}
          {status === 'healthy' && 'Atmosphere balanced, oceans thriving.'}
          {status === 'threatened' && 'Smog particles rising, temperature anomalies detected.'}
          {status === 'degraded' && 'Critical warning: Carbon particles saturating the atmosphere.'}
        </p>
      </div>
    </div>
  );
}
