import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { mapUrl, site } from "@/lib/content/site";

export function Contacts() {
  return (
    <Section
      id="contacts"
      tone="cream"
      eyebrow="Контакты"
      title="Мастерская на Короля, 9"
      lead="Здесь мы жарим, фасуем, считаем заказы и пьём кофе между партиями. Заходите."
    >
      <div className="contacts">
        <Reveal className="contacts__card">
          <div className="panel">
            <h3 className="panel__title">Адрес и часы</h3>
            <p className="contacts__address">{site.address.full}</p>
            <dl className="hours">
              {site.hours.map((row) => (
                <div className="hours__row" key={row.days}>
                  <dt className="hours__days">{row.days}</dt>
                  <dd className="hours__time">{row.time}</dd>
                </div>
              ))}
            </dl>
            <p className="contacts__note">
              Самовывоз — в эти же часы. Скажите заранее, во сколько приедете: соберём заказ и не
              будем отвлекаться от ростера.
            </p>
            <Button href={mapUrl} variant="secondary" target="_blank" rel="noreferrer noopener">
              Открыть на карте
            </Button>
          </div>
        </Reveal>

        <Reveal className="contacts__card" delay={90}>
          <div className="panel">
            <h3 className="panel__title">Где мы ещё</h3>
            <ul className="socials">
              <li>
                <a
                  className="social-link"
                  href={site.social.telegram.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span className="social-link__label">{site.social.telegram.label}</span>
                  <span className="social-link__handle">{site.social.telegram.handle}</span>
                </a>
              </li>
              <li>
                <a
                  className="social-link"
                  href={site.social.instagram.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span className="social-link__label">{site.social.instagram.label}</span>
                  <span className="social-link__handle">{site.social.instagram.handle}</span>
                </a>
              </li>
            </ul>
            <p className="contacts__note">
              Быстрее всего — телеграм: там отвечаем в течение рабочего дня. В инстаграме
              показываем, что уехало на этой неделе и что жарим в следующий четверг.
            </p>
            <p className="contacts__note">
              Судя по заявкам, вы приходите из инстаграма или из поиска и берёте зерно домой и в
              офис. Если у вас случай другой — тем интереснее, расскажите в заявке.
            </p>
            <Button href="#lead">Оставить заявку</Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
