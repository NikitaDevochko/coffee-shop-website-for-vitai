"use client";

/**
 * Анимация появления блока: IntersectionObserver, срабатывает один раз.
 *
 * При `prefers-reduced-motion: reduce` ничего не прячем и не анимируем — ни здесь,
 * ни в CSS (см. globals.css). Если IntersectionObserver недоступен, контент
 * просто показывается сразу.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Задержка появления, мс — для «лесенки» в списках. */
  delay?: number;
}

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = ["reveal", isVisible ? "reveal--visible" : "", className]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties | undefined = delay
    ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
    : undefined;

  return (
    <div ref={nodeRef} className={classes} style={style}>
      {children}
    </div>
  );
}
