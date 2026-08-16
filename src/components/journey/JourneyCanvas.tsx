import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { useScroll } from 'motion/react';
import { Scene, type SceneNode } from '../three/Scene';

interface Props {
  nodes: SceneNode[];
  /** CSS selector for the element whose scroll drives the camera. */
  target: string;
}

/**
 * If WebGL throws for any reason, unmount rather than leaving a dead canvas.
 * The DOM timeline underneath is the real content, so losing the decoration
 * costs nothing.
 */
class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }> {
  static getDerivedStateFromError() {
    return {};
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.props.children;
  }
}

export default function JourneyCanvas({ nodes, target }: Props) {
  const [failed, setFailed] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | null>(null);

  // The scroll driver is the journey <ol>, which lives outside this component —
  // it is Astro-rendered so its content stays in the static HTML.
  useEffect(() => {
    setScrollTarget(document.querySelector<HTMLElement>(target));
  }, [target]);

  const { scrollYProgress } = useScroll({
    target: scrollTarget ? { current: scrollTarget } : undefined,
    offset: ['start start', 'end end'],
  });

  // Nothing renders until we ask, so scrolling is what drives frames. Reading
  // the MotionValue inside useFrame means zero React re-renders while scrolling.
  const [invalidateHandle, setInvalidateHandle] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!invalidateHandle) return;

    const onScroll = () => invalidateHandle();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [invalidateHandle]);

  // Stop rendering entirely when the section is off screen or the tab is hidden.
  const [active, setActive] = useState(true);
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(Boolean(entry?.isIntersecting)),
      { rootMargin: '200px' },
    );
    observer.observe(node);

    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (failed) return null;

  return (
    <div ref={containerRef} className="size-full">
      <CanvasBoundary onError={() => setFailed(true)}>
        <Canvas
          // Render only when something asks for a frame — an idle tab does no
          // GPU work at all.
          frameloop={active ? 'demand' : 'never'}
          dpr={dpr}
          camera={{ fov: 42, near: 0.1, far: 120, position: [6, 2, 9] }}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl, invalidate }) => {
            setInvalidateHandle(() => invalidate);

            // A lost context leaves a frozen image on screen; drop back to the
            // DOM timeline instead.
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              setFailed(true);
            });
          }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onFallback={() => setFailed(true)} />
          <AdaptiveDpr pixelated />
          <Scene nodes={nodes} progress={scrollYProgress} />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
