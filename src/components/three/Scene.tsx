import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { MotionValue } from 'motion/react';

export interface SceneNode {
  /** 0–1 position along the timeline. */
  t: number;
  accent: 'brand' | 'accent' | 'neutral';
  featured: boolean;
}

const COLORS = {
  brand: new THREE.Color('#ff4500'),
  accent: new THREE.Color('#00a887'),
  neutral: new THREE.Color('#8a8079'),
} as const;

/**
 * Builds the path the camera travels and the nodes sit on.
 *
 * A gentle helix rather than a straight line: it gives parallax as you scroll,
 * so the depth is legible without any camera shake or added motion.
 */
function useSpine(count: number) {
  return useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 1.15;
    const height = Math.max(18, count * 3.6);

    for (let i = 0; i <= 64; i += 1) {
      const t = i / 64;
      const angle = t * Math.PI * 2 * turns;
      points.push(new THREE.Vector3(Math.sin(angle) * 3.4, -t * height, Math.cos(angle) * 3.4));
    }

    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [count]);
}

/** The timeline spine, coloured brand → accent along its length. */
function Spine({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const { points, colors } = useMemo(() => {
    const sampled = curve.getPoints(180);
    const gradient = sampled.map((_, index) => {
      const mix = index / (sampled.length - 1);
      return COLORS.brand.clone().lerp(COLORS.accent, mix);
    });
    return { points: sampled, colors: gradient };
  }, [curve]);

  return <Line points={points} vertexColors={colors} lineWidth={2} transparent opacity={0.85} />;
}

/**
 * All milestone markers in a single instanced mesh — one draw call regardless of
 * how many journey entries there are.
 */
function MilestoneNodes({
  curve,
  nodes,
  progress,
}: {
  curve: THREE.CatmullRomCurve3;
  nodes: SceneNode[];
  progress: MotionValue<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(
    () => nodes.map((node) => curve.getPointAt(THREE.MathUtils.clamp(node.t, 0, 1))),
    [curve, nodes],
  );

  // Per-instance colour has to go through setColorAt: three only compiles the
  // instancing-colour path when `instanceColor` is populated on the mesh itself.
  // Attaching an instanceColor buffer declaratively leaves the shader on its
  // default, which renders every instance black.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (const [index, node] of nodes.entries()) {
      mesh.setColorAt(index, COLORS[node.accent]);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const scroll = progress.get();

    for (const [index, node] of nodes.entries()) {
      const position = positions[index]!;
      dummy.position.copy(position);

      // Nodes swell slightly as the camera reaches them, which is what visually
      // ties the canvas to whichever entry is being read.
      const distance = Math.abs(node.t - scroll);
      const focus = THREE.MathUtils.clamp(1 - distance * 9, 0, 1);
      const scale = (node.featured ? 0.26 : 0.19) * (1 + focus * 0.55);

      dummy.scale.setScalar(scale);
      dummy.rotation.y += delta * 0.35;
      dummy.rotation.x = scroll * 2;
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      {/* Basic material: no lights in the scene, so nothing to shade against. */}
      {/* Plain white base — three multiplies it by each instance's colour. */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Depth field. One draw call, no textures. */
function Starfield({ height }: { height: number }) {
  const geometry = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);

    // Deterministic pseudo-random so the field is identical on every render and
    // between server and client.
    let seed = 7;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 44;
      positions[i * 3 + 1] = -random() * height * 1.15;
      positions[i * 3 + 2] = (random() - 0.5) * 44;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return buffer;
  }, [height]);

  return (
    <points geometry={geometry}>
      <pointsMaterial size={0.075} color="#9a908a" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

interface Props {
  nodes: SceneNode[];
  progress: MotionValue<number>;
}

export function Scene({ nodes, progress }: Props) {
  const curve = useSpine(nodes.length);
  const { camera, invalidate } = useThree();
  const smoothed = useRef(0);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const target = progress.get();

    // `damp` rather than a fixed-alpha lerp: a lerp settles at different speeds
    // on a 60 Hz and a 120 Hz display, which makes the whole scene feel
    // different depending on the monitor.
    smoothed.current = THREE.MathUtils.damp(smoothed.current, target, 4, delta);

    const t = THREE.MathUtils.clamp(smoothed.current, 0, 1);
    const position = curve.getPointAt(t);

    // Orbit the helix rather than trailing it.
    //
    // A fixed world-space offset (the previous approach) meant the spine drifted
    // in and out of frame as the helix wound around, because the curve moves in
    // x/z while the camera did not. Pushing the camera radially outward from the
    // helix axis keeps it at a constant distance and always facing inward, so
    // the spine stays centred for the whole scroll.
    const ORBIT = 3.1; // multiple of the helix radius
    camera.position.set(position.x * ORBIT, position.y + 2.2, position.z * ORBIT);

    // Look at the axis slightly below the current point, so the path ahead
    // occupies the lower half of the frame and the travelled path recedes above.
    lookAt.set(0, position.y - 2.4, 0);
    camera.lookAt(lookAt);

    // With frameloop="demand" nothing renders unless we ask. Keep asking while
    // the damping is still converging, then stop — so an idle tab costs no GPU.
    if (Math.abs(smoothed.current - target) > 0.0002) invalidate();
  });

  const height = Math.max(18, nodes.length * 3.6);

  return (
    <>
      <Spine curve={curve} />
      <MilestoneNodes curve={curve} nodes={nodes} progress={progress} />
      <Starfield height={height} />
    </>
  );
}
