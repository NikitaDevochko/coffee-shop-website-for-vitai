/**
 * Обёртка секции: вертикальные ритмы, фон (бумага / крем / тёмно-зелёный),
 * заголовок с надзаголовком и «лидом». Якорь вешается на сам <section>, чтобы
 * ссылки вида #lead работали без лишних обёрток.
 */

import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/Reveal";

export type SectionTone = "paper" | "cream" | "deep";

export interface SectionProps {
  children: ReactNode;
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lead?: ReactNode;
  tone?: SectionTone;
  className?: string;
}

export function Section({
  children,
  id,
  eyebrow,
  title,
  lead,
  tone = "paper",
  className = "",
}: SectionProps) {
  const classes = ["section", `section--${tone}`, className].filter(Boolean).join(" ");
  const hasHead = Boolean(eyebrow || title || lead);

  return (
    <section className={classes} id={id}>
      <div className="container">
        {hasHead ? (
          <Reveal className="section__head">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="section__title">{title}</h2> : null}
            {lead ? <p className="section__lead">{lead}</p> : null}
          </Reveal>
        ) : null}
        {children}
      </div>
    </section>
  );
}
