/**
 * «Доставка и самовывоз» — идёт сразу после таблицы «Процесса».
 *
 * Две карточки одинаковой ширины и высоты (см. CSS: grid + stretch).
 * Ряд цифр внизу убран по стайлгайду.
 */

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { mapUrl, site } from "@/lib/content/site";

export function Delivery() {
  return (
    <section className="delivery" id="delivery" aria-labelledby="delivery-title">
      <div className="section__head">
        <p className="eyebrow text-note">Доставка и самовывоз</p>
        <div className="delivery__heading">
          <SectionMarker />
          <h2 className="section__title" id="delivery-title">
            По пятницам — по всему Минску
          </h2>
        </div>
        <p className="text-info">
          Курьерской службы у нас нет: развозим сами, поэтому и маршрут понятный, и кофе не ночует
          на складе.
        </p>
      </div>

      <div className="delivery__grid">
        <Reveal className="delivery__card">
          <h3 className="delivery__title">Доставка в пятницу</h3>
          <ul className="delivery__list">
            <li className="text-info">
              От <strong>50 BYN</strong> — бесплатно. Набираете меньше — напишите, подскажем
              вариант: обычно получается добрать дрип-пакетами.
            </li>
            <li className="text-info">Вечером в четверг пишем или звоним, чтобы договориться о времени.</li>
            <li className="text-info">Возим по всему Минску, без наценки за район и этаж.</li>
          </ul>
        </Reveal>

        <Reveal className="delivery__card" delay={90}>
          <h3 className="delivery__title">Самовывоз с мастерской</h3>
          <ul className="delivery__list">
            <li className="text-info">
              <strong>{site.address.full}</strong>, {site.hoursHuman}.
            </li>
            <li className="text-info">Ростер стоит здесь же: попадёте на обжарку — будет что посмотреть.</li>
            <li className="text-info">
              Скажите заранее, что приедете, — соберём заказ и не будем отвлекаться от партии.
            </li>
          </ul>
          <Button href={mapUrl} target="_blank" rel="noreferrer noopener">
            Открыть на карте
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
