"use client";

import { useEffect, useState } from "react";

/**
 * Word-by-word blur-in heading (React Bits BlurText pattern, own
 * implementation). The ONE hero moment per page (taste rule) — do not use
 * elsewhere on the same page. Static under prefers-reduced-motion; pure
 * CSS transitions, no layout shift, so LCP on cheap phones is unaffected
 * (text paints immediately, only filter/opacity animate).
 */
export function BlurText({ text, className }: { text: string; className?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block transition-[opacity,filter,transform] duration-500 ease-out"
          style={{
            opacity: ready ? 1 : 0,
            filter: ready ? "blur(0)" : "blur(8px)",
            transform: ready ? "translateY(0)" : "translateY(0.35em)",
            transitionDelay: `${Math.min(i * 70, 700)}ms`,
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
