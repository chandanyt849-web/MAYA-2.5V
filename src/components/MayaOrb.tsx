import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from 'lucide-react';

interface MayaOrbProps {
  state: AssistantState;
  volumeLevel: number; // 0 to 1
  onOrbClick: () => void;
  disabled?: boolean;
}

export const MayaOrb: React.FC<MayaOrbProps> = ({
  state,
  volumeLevel,
  onOrbClick,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas particle and wave rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Responsive canvas dimensions
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    updateSize();

    // Particle nodes
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      theta: (i / particleCount) * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.012,
      baseRadius: 100 + Math.random() * 35,
      size: 1.5 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7,
    }));

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      angle += 0.02;

      // Base radius calculation with volume reactivity
      let scaleMultiplier = 1;
      if (state === 'listening') {
        scaleMultiplier = 1 + volumeLevel * 0.55;
      } else if (state === 'speaking') {
        scaleMultiplier = 1 + volumeLevel * 0.45;
      } else if (state === 'thinking') {
        scaleMultiplier = 1 + Math.sin(angle * 3) * 0.08;
      } else {
        // Idle breathing
        scaleMultiplier = 1 + Math.sin(angle * 0.7) * 0.04;
      }

      const coreRadius = Math.min(width, height) * 0.28 * scaleMultiplier;

      // Outer Glow Aura
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.4,
        centerX,
        centerY,
        coreRadius * 1.8
      );

      if (state === 'listening') {
        outerGlow.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        outerGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
        outerGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else if (state === 'speaking') {
        outerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
        outerGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
        outerGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
      } else if (state === 'thinking') {
        outerGlow.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
        outerGlow.addColorStop(0.6, 'rgba(59, 130, 246, 0.25)');
        outerGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else {
        outerGlow.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        outerGlow.addColorStop(0.5, 'rgba(139, 92, 246, 0.18)');
        outerGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
      }

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Harmonic Rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = coreRadius * (0.85 + r * 0.25);
        ctx.beginPath();
        ctx.lineWidth = 1.2;

        if (state === 'listening') {
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 - r * 0.1})`;
        } else if (state === 'speaking') {
          ctx.strokeStyle = `rgba(244, 114, 182, ${0.45 - r * 0.1})`;
        } else if (state === 'thinking') {
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.5 - r * 0.12})`;
        } else {
          ctx.strokeStyle = `rgba(129, 140, 248, ${0.25 - r * 0.08})`;
        }

        const segments = 60;
        for (let s = 0; s <= segments; s++) {
          const currentTheta = (s / segments) * Math.PI * 2;
          const wobble =
            Math.sin(currentTheta * 4 + angle * (r % 2 === 0 ? 2 : -2)) *
            (state === 'listening' || state === 'speaking' ? 6 * volumeLevel + 2 : 2.5);
          const rad = ringRadius + wobble;
          const x = centerX + Math.cos(currentTheta) * rad;
          const y = centerY + Math.sin(currentTheta) * rad;
          if (s === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Orbital Starlight Particles
      particles.forEach((p) => {
        p.theta += p.speed * (state === 'thinking' ? 3.5 : 1);
        const dynamicRadius =
          (p.baseRadius * (coreRadius / 80)) *
          (1 + Math.sin(angle + p.theta) * 0.15);
        const px = centerX + Math.cos(p.theta) * dynamicRadius;
        const py = centerY + Math.sin(p.theta) * dynamicRadius;

        ctx.fillStyle =
          state === 'listening'
            ? `rgba(110, 231, 183, ${p.opacity})`
            : state === 'speaking'
            ? `rgba(244, 114, 182, ${p.opacity})`
            : state === 'thinking'
            ? `rgba(196, 181, 253, ${p.opacity})`
            : `rgba(165, 180, 252, ${p.opacity * 0.8})`;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + volumeLevel * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      // Core Sphere Gradient
      const coreGradient = ctx.createRadialGradient(
        centerX - coreRadius * 0.25,
        centerY - coreRadius * 0.3,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius
      );

      if (state === 'listening') {
        coreGradient.addColorStop(0, '#34d399');
        coreGradient.addColorStop(0.4, '#059669');
        coreGradient.addColorStop(0.8, '#064e3b');
        coreGradient.addColorStop(1, '#022c22');
      } else if (state === 'speaking') {
        coreGradient.addColorStop(0, '#f472b6');
        coreGradient.addColorStop(0.4, '#c026d3');
        coreGradient.addColorStop(0.8, '#7e22ce');
        coreGradient.addColorStop(1, '#3b0764');
      } else if (state === 'thinking') {
        coreGradient.addColorStop(0, '#c084fc');
        coreGradient.addColorStop(0.5, '#6366f1');
        coreGradient.addColorStop(0.85, '#312e81');
        coreGradient.addColorStop(1, '#1e1b4b');
      } else {
        coreGradient.addColorStop(0, '#818cf8');
        coreGradient.addColorStop(0.4, '#4f46e5');
        coreGradient.addColorStop(0.85, '#312e81');
        coreGradient.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight gleam
      const gleamGradient = ctx.createRadialGradient(
        centerX - coreRadius * 0.35,
        centerY - coreRadius * 0.35,
        0,
        centerX - coreRadius * 0.35,
        centerY - coreRadius * 0.35,
        coreRadius * 0.65
      );
      gleamGradient.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      gleamGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      gleamGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gleamGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    window.addEventListener('resize', updateSize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [state, volumeLevel]);

  // Status text & icon
  const getStatusInfo = () => {
    switch (state) {
      case 'listening':
        return {
          title: 'Listening to Chandan...',
          subtitle: 'Speak freely, Maya is tuned in',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />,
        };
      case 'thinking':
        return {
          title: 'Maya is processing...',
          subtitle: 'Accessing deep knowledge matrix',
          badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
          icon: <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />,
        };
      case 'speaking':
        return {
          title: 'Maya is speaking...',
          subtitle: 'Tap orb to pause or interrupt',
          badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
          icon: <Volume2 className="w-4 h-4 text-pink-400 animate-bounce" />,
        };
      case 'idle':
      default:
        return {
          title: 'Maya is ready for Chandan',
          subtitle: 'Tap the orb or hold to speak',
          badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
          icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2 md:py-6">
      {/* Interactive Orb Container */}
      <div
        onClick={disabled ? undefined : onOrbClick}
        role="button"
        tabIndex={0}
        aria-label={state === 'listening' ? 'Stop listening' : 'Start speaking with Maya'}
        className={`relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 cursor-pointer transition-transform duration-300 active:scale-95 group focus:outline-none ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full pointer-events-none drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]"
        />

        {/* Center Overlay Icon for clear affordance */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
              state === 'listening'
                ? 'bg-emerald-950/70 border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                : state === 'speaking'
                ? 'bg-pink-950/70 border-pink-400/50 shadow-[0_0_25px_rgba(236,72,153,0.5)]'
                : state === 'thinking'
                ? 'bg-violet-950/70 border-violet-400/50 shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                : 'bg-indigo-950/60 border-indigo-400/30 group-hover:border-indigo-400/60 group-hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
            }`}
          >
            {state === 'listening' ? (
              <Mic className="w-7 h-7 text-emerald-300 animate-pulse" />
            ) : state === 'speaking' ? (
              <Volume2 className="w-7 h-7 text-pink-300" />
            ) : state === 'thinking' ? (
              <Loader2 className="w-7 h-7 text-violet-300 animate-spin" />
            ) : (
              <Mic className="w-7 h-7 text-indigo-200 group-hover:text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Status Capsule */}
      <div className="mt-4 flex flex-col items-center text-center">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-xs font-semibold tracking-wide uppercase shadow-lg transition-all duration-300 ${status.badgeColor}`}
        >
          {status.icon}
          <span>{status.title}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 font-medium tracking-tight">
          {status.subtitle}
        </p>
      </div>
    </div>
  );
};
