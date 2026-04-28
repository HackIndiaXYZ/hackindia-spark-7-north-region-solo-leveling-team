import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Box, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Represents the Lender's Vault
const Vault = ({ scrollRef }) => {
  const mesh = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    mesh.current.rotation.y = time * 0.2;
    mesh.current.rotation.x = time * 0.1;
    
    // Scale down slightly as we scroll
    const scroll = scrollRef.current;
    const scale = Math.max(0.5, 2 - scroll * 0.001);
    mesh.current.scale.setScalar(scale);
    mesh.current.position.y = 2 + scroll * 0.002;
  });

  return (
    <mesh ref={mesh} position={[0, 2, 0]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#22c55e"
        emissive="#16a34a"
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.8}
        wireframe
      />
    </mesh>
  );
};

// Represents Borrower Nodes
const BorrowerNodes = ({ scrollRef }) => {
  const group = useRef();
  
  const nodes = useMemo(() => [
    { position: [-3, -2, -1], color: '#9333ea' },
    { position: [3, -4, -2], color: '#3b82f6' },
    { position: [-2, -6, 1], color: '#f59e0b' },
  ], []);

  useFrame((state) => {
    const scroll = scrollRef.current;
    group.current.position.y = scroll * 0.005; // Move them up as we scroll
  });

  return (
    <group ref={group}>
      {nodes.map((node, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={node.position}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color={node.color} roughness={0.1} metalness={0.8} transparent opacity={0.6} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

// Represents the money flowing from Vault to Borrowers
const MoneyFlow = ({ scrollRef }) => {
  const count = 30;
  const meshRef = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const initialPositions = useMemo(() => {
    return new Array(count).fill().map(() => ({
      x: (Math.random() - 0.5) * 2,
      y: 2 + (Math.random() - 0.5),
      z: (Math.random() - 0.5) * 2,
      speed: Math.random() * 0.02 + 0.01,
      targetIdx: Math.floor(Math.random() * 3)
    }));
  }, [count]);

  const targets = [
    new THREE.Vector3(-3, -2, -1),
    new THREE.Vector3(3, -4, -2),
    new THREE.Vector3(-2, -6, 1),
  ];

  useFrame(() => {
    const scroll = scrollRef.current;
    // Animation progress based on scroll. Max scroll approx 2000px.
    const progress = Math.min(1, Math.max(0, scroll / 1500));

    for (let i = 0; i < count; i++) {
      const initPos = initialPositions[i];
      const target = targets[initPos.targetIdx];
      
      // Interpolate position based on scroll progress and some random noise
      const currentProgress = Math.min(1, progress * (1 + initPos.speed * 10));
      
      const x = THREE.MathUtils.lerp(initPos.x, target.x, currentProgress);
      const y = THREE.MathUtils.lerp(initPos.y, target.y + (scroll * 0.005), currentProgress); // Adjust for borrower movement
      const z = THREE.MathUtils.lerp(initPos.z, target.z, currentProgress);

      dummy.position.set(x, y, z);
      
      // Rotate the money packets
      dummy.rotation.x += 0.05;
      dummy.rotation.y += 0.05;
      
      // Scale down when reaching target
      const scale = currentProgress > 0.9 ? 1 - ((currentProgress - 0.9) * 10) : 1;
      dummy.scale.setScalar(scale * 0.15);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[1, 0.5, 0.2]} />
      <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
    </instancedMesh>
  );
};

const BackgroundParticles = () => {
    const count = 200;
    const points = useRef();
  
    const positions = useMemo(() => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
      }
      return pos;
    }, [count]);
  
    useFrame((state) => {
      points.current.rotation.y += 0.0005;
    });
  
    return (
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#c084fc" transparent opacity={0.3} sizeAttenuation />
      </points>
    );
};

const Hero3D = () => {
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-80 h-screen w-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#22c55e" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#9333ea" />
        
        <Vault scrollRef={scrollRef} />
        <BorrowerNodes scrollRef={scrollRef} />
        <MoneyFlow scrollRef={scrollRef} />
        
        <BackgroundParticles />
      </Canvas>
    </div>
  );
};

export default Hero3D;
