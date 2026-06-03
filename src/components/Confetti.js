"use client";
import { useEffect, useRef } from "react";

const COLORS = [
  "#8fbe6b", "#c4e898", "#e8a84a", "#f2ead8",
  "#ffdd77", "#ff9de2", "#7eb8ff", "#5eb87a", "#fff9a0",
];

export default function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Burst from centre-top
    const cx = canvas.width / 2;
    const pieces = Array.from({ length: 160 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const speed = 6 + Math.random() * 14;
      return {
        x:      cx + (Math.random() - 0.5) * 60,
        y:      canvas.height * 0.35,
        vx:     Math.cos(angle) * speed,
        vy:     Math.sin(angle) * speed,
        w:      5 + Math.random() * 9,
        h:      3 + Math.random() * 5,
        color:  COLORS[Math.floor(Math.random() * COLORS.length)],
        angle:  Math.random() * Math.PI * 2,
        spin:   (Math.random() - 0.5) * 0.25,
        gravity: 0.38 + Math.random() * 0.18,
        drag:   0.98,
        opacity: 1,
      };
    });

    let frame = 0;
    const MAX_FRAMES = 220;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      let alive = false;

      for (const p of pieces) {
        p.vx  *= p.drag;
        p.vy  += p.gravity;
        p.x   += p.vx;
        p.y   += p.vy;
        p.angle += p.spin;

        if (frame > MAX_FRAMES * 0.6) p.opacity -= 0.022;

        if (p.opacity > 0 && p.y < canvas.height + 30) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          // Alternate shapes: rect vs ellipse
          if (Math.random() > 0.5) {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          } else {
            ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      if (alive && frame < MAX_FRAMES * 2) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        if (onDone) onDone();
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}
