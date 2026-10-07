import React, { useEffect, useRef } from 'react';

// ─── Particle Canvas ────────────────────────────────────────────────────────
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle colors — vibrant game palette
    const colors = [
      '#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899',
      '#f59e0b', '#10b981', '#f97316', '#6366f1',
    ];

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      color: string; pulse: number; pulseSpeed: number;
    }

    const COUNT = 55;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 3.5 + 1.2,
      alpha: Math.random() * 0.6 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.pulse += p.pulseSpeed;
        const alpha = p.alpha + Math.sin(p.pulse) * 0.2;

        // Glowing dot
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        grd.addColorStop(0, p.color + 'ff');
        grd.addColorStop(0.4, p.color + '88');
        grd.addColorStop(1, p.color + '00');
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Solid core
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha + 0.3));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
      }

      // Draw connections between close particles
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.globalAlpha = (1 - dist / 90) * 0.18;
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.75 }}
    />
  );
};

// ─── Main HomeBackground Component ──────────────────────────────────────────
export const HomeBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: 0 }}>

      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950" />

      {/* ── Animated Color Orbs ── */}
      {/* Orb 1 — Blue/Cyan top-left */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(6,182,212,0.25) 50%, transparent 75%)',
          animation: 'orbFloat1 8s ease-in-out infinite',
          filter: 'blur(2px)',
        }}
      />

      {/* Orb 2 — Purple/Pink top-right */}
      <div className="absolute -top-10 -right-16 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(236,72,153,0.25) 50%, transparent 75%)',
          animation: 'orbFloat2 10s ease-in-out infinite',
          filter: 'blur(2px)',
        }}
      />

      {/* Orb 3 — Amber/Orange center */}
      <div className="absolute top-1/3 -left-10 w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(249,115,22,0.2) 50%, transparent 75%)',
          animation: 'orbFloat3 12s ease-in-out infinite',
          filter: 'blur(3px)',
        }}
      />

      {/* Orb 4 — Green/Teal lower right */}
      <div className="absolute bottom-1/4 -right-12 w-56 h-56 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, rgba(6,182,212,0.2) 50%, transparent 75%)',
          animation: 'orbFloat4 9s ease-in-out infinite',
          filter: 'blur(2px)',
        }}
      />

      {/* Orb 5 — Red/Pink bottom-left */}
      <div className="absolute -bottom-16 -left-8 w-52 h-52 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(236,72,153,0.2) 50%, transparent 75%)',
          animation: 'orbFloat5 11s ease-in-out infinite',
          filter: 'blur(2px)',
        }}
      />

      {/* Orb 6 — Indigo center-right */}
      <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(139,92,246,0.2) 50%, transparent 75%)',
          animation: 'orbFloat6 7s ease-in-out infinite',
          filter: 'blur(2px)',
        }}
      />

      {/* ── Rotating Gradient Rings ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ring 1 */}
        <div style={{
          position: 'absolute',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          border: '1.5px solid transparent',
          background: 'linear-gradient(#0f172a, #0f172a) padding-box, conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6) border-box',
          animation: 'ringRotate 8s linear infinite',
          opacity: 0.45,
        }} />
        {/* Ring 2 — counter rotate */}
        <div style={{
          position: 'absolute',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          border: '1px solid transparent',
          background: 'linear-gradient(#0f172a, #0f172a) padding-box, conic-gradient(from 180deg, #06b6d4, #6366f1, #f97316, #06b6d4) border-box',
          animation: 'ringRotateReverse 6s linear infinite',
          opacity: 0.4,
        }} />
        {/* Ring 3 */}
        <div style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          border: '1px solid transparent',
          background: 'linear-gradient(#0f172a, #0f172a) padding-box, conic-gradient(from 90deg, #ec4899, #3b82f6, #10b981, #ec4899) border-box',
          animation: 'ringRotate 4s linear infinite',
          opacity: 0.5,
        }} />
      </div>

      {/* ── Floating 3D Disk shapes ── */}
      {[
        { top: '18%', left: '12%', color: '#3b82f6', size: 28, delay: '0s' },
        { top: '30%', right: '10%', color: '#8b5cf6', size: 22, delay: '1.5s' },
        { top: '55%', left: '8%',  color: '#10b981', size: 18, delay: '0.8s' },
        { top: '65%', right: '15%', color: '#f59e0b', size: 24, delay: '2s' },
        { top: '80%', left: '25%', color: '#ec4899', size: 16, delay: '1s' },
        { top: '12%', right: '25%', color: '#06b6d4', size: 20, delay: '2.5s' },
        { top: '42%', left: '5%',  color: '#f97316', size: 14, delay: '0.4s' },
        { top: '88%', right: '8%', color: '#6366f1', size: 18, delay: '1.8s' },
      ].map((disk, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: disk.top,
            left: 'left' in disk ? disk.left : undefined,
            right: 'right' in disk ? disk.right : undefined,
            width: disk.size,
            height: disk.size / 3,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 35% 35%, ${disk.color}ff, ${disk.color}66)`,
            boxShadow: `0 0 ${disk.size}px ${disk.color}88, 0 ${disk.size / 4}px ${disk.size / 2}px rgba(0,0,0,0.5)`,
            animation: `diskFloat 5s ease-in-out ${disk.delay} infinite`,
            transform: 'perspective(200px) rotateX(55deg)',
          }}
        />
      ))}

      {/* ── Canvas particle layer ── */}
      <ParticleCanvas />

      {/* ── Color sweep overlay — subtle breathing ── */}
      <div className="absolute inset-0"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(59,130,246,0.04) 60deg, transparent 120deg, rgba(139,92,246,0.04) 180deg, transparent 240deg, rgba(16,185,129,0.04) 300deg, transparent 360deg)',
          animation: 'colorSweep 15s linear infinite',
        }}
      />

      {/* ── Bottom fade for content readability ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, 25px) scale(1.08); }
          66%       { transform: translate(-15px, 40px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-25px, 30px) scale(1.1); }
          70%       { transform: translate(10px, -20px) scale(0.92); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          30%       { transform: translate(20px, -30px) scale(1.05); }
          60%       { transform: translate(-10px, 20px) scale(0.96); }
        }
        @keyframes orbFloat4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          35%       { transform: translate(-20px, -25px) scale(1.07); }
          65%       { transform: translate(15px, 15px) scale(0.94); }
        }
        @keyframes orbFloat5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          45%       { transform: translate(25px, -20px) scale(1.06); }
          75%       { transform: translate(-5px, 10px) scale(0.97); }
        }
        @keyframes orbFloat6 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-18px, -22px) scale(1.09); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ringRotateReverse {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes diskFloat {
          0%, 100% { transform: perspective(200px) rotateX(55deg) translateY(0px); opacity: 0.7; }
          50%       { transform: perspective(200px) rotateX(55deg) translateY(-12px); opacity: 1; }
        }
        @keyframes colorSweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

