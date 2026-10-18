/**
 * Обёртка секции: горизонтальные отступы (--pad-x), вертикальные ритмы,
 * фон блока и необязательная шапка с надзаголовком и лидом.
 *
 * Закладку раздела и заголовок рисует сама секция — так закладку можно
 * поставить в одну строку с заголовком (см. блок «О нас») и она гарантированно
 * есть везде, где нужна.
 */

import type { ReactNode } from "react";

export type SectionTone = "plain" | "about" | "menu" | "process";

export interface SectionProps {
  children: ReactNode;
  id?: string;
  eyebrow?: string;
  lead?: ReactNode;
  tone?: SectionTone;
  className?: string;
}

export function Section({
  children,
  id,
  eyebrow,
  lead,
  tone = "plain",
  className = "",
}: SectionProps) {
  const classes = ["section", `section--${tone}`, className].filter(Boolean).join(" ");
  const hasHead = Boolean(eyebrow || lead);

  return (
    <section className={classes} id={id}>
      <div className="section__inner">
        {hasHead ? (
          <div className="section__head">
            {eyebrow ? <p className="eyebrow text-note">{eyebrow}</p> : null}
            {lead ? <p className="text-info">{lead}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
