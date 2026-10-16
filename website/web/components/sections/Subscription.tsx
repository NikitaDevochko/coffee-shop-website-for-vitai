"use client";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { site } from "@/lib/content/site";
import { selectIntent } from "@/lib/selection";

const terms = [
  "Состав можно менять: в один месяц два разных зерна, в другой — две пачки любимого.",
  "Доставка включена: привозим в пятницу вместе с обычными заказами или отдаём с ул. Короля, 9.",
  "Если уезжаете в отпуск — напишите, пропустим месяц и вернёмся, когда вернётесь вы.",
];

export function Subscription() {
  return (
    <Section
      id="subscription"
      tone="deep"
      eyebrow="Подписка"
      title="Две пачки раз в месяц — 54 BYN"
      lead="Для тех, кто пьёт кофе дома каждый день и не хочет думать о том, что пачка закончилась."
    >
      <div className="subscription">
        <Reveal className="subscription__price">
          <p className="subscription__price-value">
            {site.subscription.priceByn}
            <span className="subscription__price-currency">BYN</span>
          </p>
          <p className="subscription__price-period">в месяц, доставка уже внутри</p>
          <p className="subscription__price-detail">
            {site.subscription.packs} пачки по {site.subscription.packWeight} — это 100 г кофе,
            примерно 8–10 чашек в месяц
          </p>
        </Reveal>

        <div className="subscription__body">
          <ul className="subscription__list">
            {terms.map((term, index) => (
              <li className="subscription__item" key={term}>
                <Reveal delay={index * 70}>{term}</Reveal>
              </li>
            ))}
          </ul>

          <Reveal delay={210}>
            <p className="subscription__note">
              Обжарка та же: жарим в четверг, везём в пятницу. Никаких «подписочных» остатков с
              прошлого месяца.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="subscription__actions">
              <Button href="#lead" size="lg" onClick={() => selectIntent("subscription")}>
                Оформить подписку
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
