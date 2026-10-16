"use client";

/**
 * Ассортимент с ценами из брифа. Кнопка «Отложить» — это ссылка на #lead,
 * которая заодно кладёт выбранную позицию в форму (см. lib/selection.ts).
 */

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { coffeePositions } from "@/lib/content/coffee";
import { selectPosition } from "@/lib/selection";

export function Assortment() {
  return (
    <Section
      id="assortment"
      tone="cream"
      eyebrow="Что жарим сейчас"
      title="Четыре позиции — и хватит"
      lead="Маленький ассортимент — не лень, а способ успевать за каждой партией. Всё фасуем по 50 г: это три-четыре чашки в воронке или пять-шесть эспрессо."
    >
      <div className="coffee-grid">
        {coffeePositions.map((position, index) => (
          <Reveal key={position.id} delay={index * 70}>
            <article className="coffee-card">
              {position.badge ? (
                <span className="coffee-card__badge">{position.badge}</span>
              ) : null}

              <h3 className="coffee-card__name">{position.name}</h3>
              <p className="coffee-card__tagline">{position.tagline}</p>

              <ul className="coffee-card__notes">
                {position.notes.map((note) => (
                  <li className="coffee-note" key={note}>
                    {note}
                  </li>
                ))}
                {position.roast ? <li className="coffee-note coffee-note--roast">{position.roast}</li> : null}
              </ul>

              <p className="coffee-card__description">{position.description}</p>
              <p className="coffee-card__brew">{position.brew}</p>

              <div className="coffee-card__foot">
                <p className="coffee-card__price">
                  <span className="coffee-card__price-value">{position.priceByn}</span>
                  <span className="coffee-card__price-unit">BYN</span>
                  <span className="coffee-card__weight">/ {position.weight}</span>
                </p>
                <Button
                  href="#lead"
                  variant="secondary"
                  onClick={() => selectPosition(position.id)}
                  aria-label={`Отложить ${position.name}`}
                >
                  Отложить
                </Button>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <p className="coffee-footnote">
          Не знаете, что выбрать? Напишите в заявке «на ваш вкус» — предложим зерно под ваш способ
          заваривания. Оплата при получении: наличными или картой.
        </p>
      </Reveal>
    </Section>
  );
}
