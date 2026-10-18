"use client";

/**
 * Подписка. Живёт внутри блока «Меню» (см. Assortment.tsx) — тот же фон,
 * но содержимое оформлено двумя белыми карточками одинаковой ширины.
 *
 * Карточки: слева цена и состав, справа условия списком с точками-маркерами.
 * Высота карточек подстраивается по контенту и выравнивается по большей.
 */

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { site } from "@/lib/content/site";
import { selectIntent } from "@/lib/selection";

const terms = [
  "Состав можно менять: в один месяц два разных зерна, в другой — две пачки любимого.",
  "Доставка включена: привозим в пятницу вместе с обычными заказами или отдаём с ул. Короля, 9.",
  "Если уезжаете в отпуск — напишите, пропустим месяц и вернёмся, когда вернётесь вы.",
  "Обжарка та же: жарим в четверг, везём в пятницу. Никаких «подписочных» остатков с прошлого месяца.",
];

export function Subscription() {
  return (
    <div className="subscription" id="subscription">
      <div className="section__head">
        <p className="eyebrow text-note">Подписка</p>
        <div className="subscription__heading">
          <SectionMarker />
          <h3 className="section__title">Две пачки раз в месяц</h3>
        </div>
        <p className="text-info">
          Для тех, кто пьёт кофе дома каждый день и не хочет думать о том, что пачка закончилась.
        </p>
      </div>

      <div className="subscription__body">
        <Reveal className="subscription__card">
          <p className="subscription__price-value">
            {site.subscription.priceByn}
            <span className="subscription__price-currency text-note">BYN</span>
          </p>
          <p className="text-info">в месяц, доставка уже внутри</p>
          <p className="text-info">
            {site.subscription.packs} пачки по {site.subscription.packWeight} — это 100 г кофе,
            <br />
            примерно 8–10 чашек в месяц
          </p>
        </Reveal>

        <div className="subscription__card">
          <ul className="subscription__list">
            {terms.map((term) => (
              <li className="text-info subscription__item" key={term}>
                {term}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Кнопка вынесена под обе карточки — по центру всего блока «Меню». */}
      <div className="subscription__action">
        <Button href="#lead" onClick={() => selectIntent("subscription")}>
          Оформить подписку
        </Button>
      </div>
    </div>
  );
}
