/**
 * Кнопка и CTA-ссылка. Один компонент на два случая: `href` — ссылка, без `href` —
 * настоящая кнопка (submit в форме).
 *
 * Единый стиль по стайлгайду: 14px, padding 8px/16px, радиус 16px, фон #473334.
 * Вариантов и размеров нет намеренно — все кнопки на странице выглядят одинаково.
 */

import type { MouseEvent, ReactNode } from "react";

export interface ButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  id?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  "aria-label"?: string;
}

export function Button({
  children,
  isLoading = false,
  disabled = false,
  className = "",
  href,
  target,
  rel,
  type = "button",
  name,
  value,
  id,
  onClick,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = ["btn", isLoading ? "btn--loading" : "", className].filter(Boolean).join(" ");

  const inner = (
    <>
      {isLoading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className="btn__label">{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        target={target}
        rel={rel}
        id={id}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading || disabled || undefined}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      name={name}
      value={value}
      id={id}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
    >
      {inner}
    </button>
  );
}
