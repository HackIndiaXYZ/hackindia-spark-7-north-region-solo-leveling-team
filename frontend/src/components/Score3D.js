import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ScoreRing = ({ score }) => {
  const arcRef = useRef();
  const targetRotation = (score / 900) * Math.PI * 2;
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (arcRef.current) {
        // Slow rotation for life
        arcRef.current.rotation.z = THREE.MathUtils.lerp(arcRef.current.rotation.z, -targetRotation, 0.05);
    }
  });

  // Calculate color based on score
  const color = useMemo(() => {
    if (score > 700) return '#4ade80'; // Success/Green
    if (score > 500) return '#facc15'; // Warning/Yellow
    return '#f87171'; // Error/Red
  }, [score]);

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Background Track */}
      <mesh>
        <torusGeometry args={[2, 0.05, 12, 48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.05} />
      </mesh>
      
      {/* Score Arc */}
      <mesh ref={arcRef}>
        <torusGeometry args={[2, 0.08, 12, 48, targetRotation]} />
        <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={2} 
            toneMapped={false}
        />
      </mesh>

      {/* Center Sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <MeshDistortMaterial
                color={color}
                speed={2}
                distort={0.3}
                radius={1}
                emissive={color}
                emissiveIntensity={0.5}
            />
          </mesh>
      </Float>
    </group>
  );
};

const Score3D = ({ score = 0 }) => {
  return (
    <div className="w-full h-[400px] relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#9333ea" />
        
        <ScoreRing score={score} />
        
        <Text
            position={[0, 0, 1]}
            fontSize={0.8}
            color="white"
            font="https://fonts.gstatic.com/s/manrope/v13/xn7_tHE41ni1AdIRqAuZux1a29D-S_C6MxH_LQ.woff"
            anchorX="center"
            anchorY="middle"
        >
            {Math.round(score)}
        </Text>
        <Text
            position={[0, -0.8, 1]}
            fontSize={0.2}
            color="#A6ABBB"
            anchorX="center"
            anchorY="middle"
        >
            PRECISION SCORE
        </Text>
      </Canvas>
      
      {/* Overlay Glow */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-primary/10 to-transparent"></div>
    </div>
  );
};

export default Score3D;
