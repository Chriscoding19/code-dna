import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { DNASequence } from '../lib/dna';

interface HelixProps {
  sequence: DNASequence;
}

function HelixStructure({ sequence }: HelixProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y -= delta * 0.02;
    }
  });

  const { backbone1, backbone2, rungs, particlePositions } = useMemo(() => {
    const bases = sequence.bases;
    const num = bases.length;
    const height = 20;
    const radius = 2.4;
    const turns = 4;

    const backbone1: [number, number, number][] = [];
    const backbone2: [number, number, number][] = [];
    const rungs: {
      pos: [number, number, number];
      color: string;
      intensity: number;
    }[] = [];

    for (let i = 0; i < num; i++) {
      const t = i / (num - 1);
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * height;

      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      backbone1.push([x1, y, z1]);
      backbone2.push([x2, y, z2]);

      if (i % 2 === 0) {
        rungs.push({
          pos: [(x1 + x2) / 2, y, (z1 + z2) / 2],
          color: bases[i].color,
          intensity: bases[i].intensity,
        });
      }
    }

    // Floating particles around the helix
    const particlePositions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const r = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 28;
      particlePositions[i * 3] = Math.cos(theta) * r;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(theta) * r;
    }

    return { backbone1, backbone2, rungs, particlePositions };
  }, [sequence]);

  return (
    <group>
      <group ref={groupRef}>
        {/* Backbone strand 1 */}
        {backbone1.map((pos, i) => (
          <mesh key={`b1-${i}`} position={pos}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial
              color="#a5b4fc"
              emissive="#6366f1"
              emissiveIntensity={0.45}
              roughness={0.3}
            />
          </mesh>
        ))}

        {/* Backbone strand 2 */}
        {backbone2.map((pos, i) => (
          <mesh key={`b2-${i}`} position={pos}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial
              color="#c4b5fd"
              emissive="#8b5cf6"
              emissiveIntensity={0.45}
              roughness={0.3}
            />
          </mesh>
        ))}

        {/* Base pair rungs */}
        {rungs.map((rung, i) => (
          <group key={`rung-${i}`} position={rung.pos}>
            <mesh>
              <boxGeometry args={[4.1, 0.09, 0.09]} />
              <meshStandardMaterial
                color={rung.color}
                emissive={rung.color}
                emissiveIntensity={0.5 + rung.intensity * 0.7}
                transparent
                opacity={0.9}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[-1.85, 0, 0]}>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial
                color={rung.color}
                emissive={rung.color}
                emissiveIntensity={1.4}
              />
            </mesh>
            <mesh position={[1.85, 0, 0]}>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial
                color={rung.color}
                emissive={rung.color}
                emissiveIntensity={1.4}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Ambient particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#818cf8"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function DNAHelix({ sequence }: HelixProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 480 }}>
      <Canvas camera={{ position: [0, 0, 16], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#07070f']} />
        <ambientLight intensity={0.25} />
        <pointLight position={[12, 12, 12]} intensity={1.4} color="#c4b5fd" />
        <pointLight position={[-12, -6, -10]} intensity={0.7} color="#6366f1" />
        <pointLight position={[0, 0, 10]} intensity={0.4} color="#f0abfc" />
        <Stars radius={80} depth={40} count={1200} factor={3} saturation={0.3} fade speed={0.6} />
        <HelixStructure sequence={sequence} />
        <OrbitControls
          enablePan={false}
          minDistance={9}
          maxDistance={24}
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
