"use client";

import { Line, Sphere } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

const NODE_COUNT = 16;
const CLUSTER_RADIUS = 2.4;
const MAX_EDGE_LENGTH = 2.6;
const ROTATION_SPEED = 0.04; // radians per second on the Y axis
const NODE_COLOR = "#95A8F0"; // --color-accent
const EDGE_COLOR = "#8B9CE5"; // --color-accent-link

type GraphData = {
  nodes: THREE.Vector3[];
  edges: [number, number][];
};

function buildGraph(): GraphData {
  // Fibonacci-sphere distribution + per-node radial jitter — gives the
  // cluster a "loose constellation" feel rather than a perfectly tidy
  // shell. Both look matters and we want it to read as a network, not
  // a planet.
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const r = CLUSTER_RADIUS * (0.7 + Math.random() * 0.4);
    nodes.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ),
    );
  }

  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].distanceTo(nodes[j]) < MAX_EDGE_LENGTH) {
        edges.push([i, j]);
      }
    }
  }
  return { nodes, edges };
}

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes, edges } = useMemo(() => buildGraph(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * ROTATION_SPEED;
    // Gentle tilt oscillation; gives parallax without being seasick-inducing.
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.12) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <Sphere key={`node-${i}`} position={pos} args={[0.07, 16, 16]}>
          <meshStandardMaterial
            color={NODE_COLOR}
            emissive={NODE_COLOR}
            emissiveIntensity={0.6}
            roughness={0.4}
            metalness={0.2}
          />
        </Sphere>
      ))}
      {edges.map(([a, b], i) => (
        <Line
          key={`edge-${i}`}
          points={[nodes[a], nodes[b]]}
          color={EDGE_COLOR}
          lineWidth={0.5}
          transparent
          opacity={0.35}
        />
      ))}
    </group>
  );
}

/**
 * Three.js mount used as the hero centerpiece. Renders 16 emissive
 * spheres connected by faint wireframe edges, the whole group rotating
 * slowly on Y with a soft X oscillation.
 *
 * Performance budget:
 *   - 16 spheres × 16-segment geometry → trivially cheap.
 *   - Edges drawn as drei `<Line>` (fat-line shader), one per pair —
 *     ~30-40 edges at this density.
 *   - DPR capped at [1, 1.5] so retina laptops don't double the cost.
 *   - On reduced-motion, the canvas is replaced by a static blurred
 *     gradient orb so the layout column doesn't collapse.
 */
export function HeroNetwork() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden
        className="relative flex h-full w-full items-center justify-center"
      >
        <div
          className="h-3/4 w-3/4 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(149,168,240,0.35) 0%, rgba(176,164,224,0.15) 40%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 5]} intensity={0.7} color={NODE_COLOR} />
      <pointLight
        position={[-4, -3, -2]}
        intensity={0.3}
        color={EDGE_COLOR}
      />
      <NetworkScene />
    </Canvas>
  );
}
