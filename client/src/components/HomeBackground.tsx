import React, { useEffect, useRef } from 'react';
import { createSlingPuckBackground } from './SlingPuckBackground';

// ─── Main HomeBackground Component with 3D Sling Puck Simulation ────────────
export const HomeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize optimized 3D Sling Puck animation background
    const bg = createSlingPuckBackground(container, {
      autoStart: true,
      parallax: true,
      quality: 'high',
      pucksPerSide: 5,
      turnDelay: 1.3,
      maxPixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
    });

    return () => {
      bg.dispose();
    };
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      {/* ── 3D WebGL Arena Canvas Container ── */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* ── Subtle Ambient Glow Corners (enhances gaming aesthetic without obscuring 3D board) ── */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 75%)',
          filter: 'blur(32px)',
        }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 75%)',
          filter: 'blur(32px)',
        }}
      />

      {/* ── Subtle Bottom Vignette for UI Navigation Legibility ── */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none" />
    </div>
  );
};
