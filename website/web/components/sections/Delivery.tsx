import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { mapUrl, site } from "@/lib/content/site";

export function Delivery() {
  return (
    <Section
      id="delivery"
      tone="paper"
      eyebrow="Доставка и самовывоз"
      title="По пятницам — по всему Минску"
      lead="Курьерской службы у нас нет: развозим сами, поэтому и маршрут понятный, и кофе не ночует на складе."
    >
      <div className="delivery">
        <Reveal className="delivery__card">
          <div className="panel">
            <h3 className="panel__title">Доставка в пятницу</h3>
            <ul className="panel__list">
              <li>
                От <strong>50 BYN</strong> — бесплатно. Набираете меньше — напишите, подскажем
                вариант: обычно получается добрать дрип-пакетами.
              </li>
              <li>Вечером в четверг пишем или звоним, чтобы договориться о времени.</li>
              <li>Возим по всему Минску, без наценки за район и этаж.</li>
            </ul>
          </div>
        </Reveal>

        <Reveal className="delivery__card" delay={90}>
          <div className="panel">
            <h3 className="panel__title">Самовывоз с мастерской</h3>
            <ul className="panel__list">
              <li>
                <strong>{site.address.full}</strong>, {site.hoursHuman}.
              </li>
              <li>Ростер стоит здесь же: попадёте на обжарку — будет что посмотреть.</li>
              <li>Скажите заранее, что приедете, — соберём заказ и не будем отвлекаться от партии.</li>
            </ul>
            <Button href={mapUrl} variant="ghost" target="_blank" rel="noreferrer noopener">
              Открыть на карте
            </Button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={140}>
        <dl className="facts">
          <div className="fact">
            <dt className="fact__value">пятница</dt>
            <dd className="fact__label">день доставки по Минску</dd>
          </div>
          <div className="fact">
            <dt className="fact__value">от 50 BYN</dt>
            <dd className="fact__label">доставка бесплатная</dd>
          </div>
          <div className="fact">
            <dt className="fact__value">пн–пт 8:00–20:00</dt>
            <dd className="fact__label">мастерская открыта</dd>
          </div>
          <div className="fact">
            <dt className="fact__value">сб–вс 10:00–18:00</dt>
            <dd className="fact__label">в выходные — тоже можно забрать</dd>
          </div>
        </dl>
      </Reveal>
    </Section>
  );
}
