"use client";

/**
 * Блок «Меню»: четыре позиции чередованием «картинка / описание», под ними
 * подписка (тот же фон и цвета, что у меню).
 *
 * Теги-дескрипторы из карточки убраны; вкусы идут строкой, способ заваривания
 * перенесён в описание — текст не теряется.
 */

import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { coffeePositions } from "@/lib/content/coffee";
import { selectPosition } from "@/lib/selection";
import { Subscription } from "@/components/sections/Subscription";

const POSITION_IMAGES: Record<string, string> = {
  "ethiopia-yirgacheffe": "/img/coff_1.webp",
  "colombia-huila": "/img/coff_2.webp",
  "brazil-cerrado": "/img/coff_3.webp",
  "drip-assorted": "/img/coff_4.webp",
};

export function Assortment() {
  return (
    <Section id="menu" tone="menu">
      <div className="menu__row">
        <div className="section__head section__head--with-marker">
          <SectionMarker />
          <h2 className="section__title">
            Что жарим сейчас
            <br />
            Четыре позиции — и хватит
          </h2>
        </div>

        <p className="menu__intro-text text-info">
          Маленький ассортимент — не лень, а способ успевать за каждой партией. Всё фасуем по 50 г:
          это три-четыре чашки в воронке или пять-шесть эспрессо.
        </p>
      </div>

      <ul className="menu__list">
        {coffeePositions.map((position, index) => {
          const image = POSITION_IMAGES[position.id];
          const isEven = index % 2 === 1;

          return (
            <li
              className={isEven ? "menu__item menu__item--reverse" : "menu__item"}
              key={position.id}
            >
              <Reveal className="menu__media">
                <Image
                  className="menu__photo"
                  src={image}
                  alt={position.name}
                  width={400}
                  height={400}
                  sizes="(min-width: 900px) 400px, 90vw"
                />
              </Reveal>

              <Reveal className="menu__body" delay={80}>
                <h3 className="menu__name">{position.name}</h3>
                <p className="menu__tastes text-info">
                  {[...position.notes, position.roast].filter(Boolean).join(", ")}
                </p>
                <p className="menu__description text-info">
                  {position.description} {position.brew}
                </p>
                <p className="menu__price text-info">
                  {position.weight} — {position.priceByn} BYN
                </p>
                <Button
                  href="#lead"
                  onClick={() => selectPosition(position.id)}
                  aria-label={`Отложить ${position.name}`}
                >
                  Отложить
                </Button>
              </Reveal>
            </li>
          );
        })}
      </ul>

      <Reveal delay={120}>
        <p className="menu__footnote text-info">
          Не знаете, что выбрать? Напишите в заявке «на ваш вкус» — предложим зерно под ваш способ
          заваривания. Оплата при получении: наличными или картой.
        </p>
      </Reveal>

      <Subscription />
    </Section>
  );
}
