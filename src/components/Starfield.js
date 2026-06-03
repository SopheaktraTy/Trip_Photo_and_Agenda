"use client";

import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let stars = [];
    let animationFrameId;
    let W = 0;
    let H = 0;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function initStars(count) {
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random(),
          speed: Math.random() * 0.004 + 0.002,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const alpha = s.a * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242, 234, 216, ${alpha})`;
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(draw);
    }

    resize();
    initStars(120);
    window.addEventListener("resize", () => {
      resize();
      initStars(120);
    });

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas id="inv-stars" ref={canvasRef}></canvas>;
}
