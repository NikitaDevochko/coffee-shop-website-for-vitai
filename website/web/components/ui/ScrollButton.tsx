"use client";

/**
 * Кнопка перехода к следующему блоку. Плавный скролл, при
 * `prefers-reduced-motion` — обычный прыжок без анимации.
 */

import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";

export interface ScrollButtonProps {
  targetId: string;
  children: ReactNode;
  className?: string;
}

export function ScrollButton({ targetId, children, className }: ScrollButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <Button type="button" className={className} onClick={handleClick}>
      {children}
    </Button>
  );
}
