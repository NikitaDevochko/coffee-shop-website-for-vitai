import { Button } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { site } from "@/lib/content/site";

const marqueeItems = [
  "обжарено в четверг",
  "развозим по пятницам",
  "партии по 5 кг",
  "зерно у вас на 1–3 день",
  `Минск, ${site.address.street}`,
];

const facts = [
  { value: "5 кг", label: "размер партии: больше ростер не возьмёт за раз" },
  { value: "четверг", label: "день обжарки" },
  { value: "пятница", label: "день доставки по Минску" },
  { value: "1–3 день", label: "к этому моменту кофе у вас" },
];

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__inner">
        <p className="hero__brand">
          <span className="hero__brand-mark" aria-hidden="true">
            К
          </span>
          <span className="hero__brand-text">
            Обжарка {site.nameQuoted} · {site.city}
          </span>
        </p>

        <p className="hero__eyebrow">Жарим сами с {site.foundedYear} года, партиями по 5 кг</p>

        <h1 className="hero__title">
          Обжариваем в четверг — <span className="hero__title-accent">в пятницу уже у вас</span>
        </h1>

        <p className="hero__lead">
          Мы — Аня и Дмитрий, оба раньше стояли за барной стойкой. Теперь жарим кофе в Минске
          маленькими партиями: в четверг — обжарка, в пятницу — развоз. Пакет открываете на 1–3
          день после обжарки, пока зерно ещё отдаёт всё, за что мы его покупали.
        </p>

        <div className="hero__actions">
          <Button href="#lead" size="lg">
            Оставить заявку
          </Button>
          <a className="hero__scroll-link" href="#assortment">
            Посмотреть кофе и цены
          </a>
        </div>

        <dl className="hero__facts">
          {facts.map((fact) => (
            <div className="hero__fact" key={fact.value}>
              <dt className="hero__fact-value">{fact.value}</dt>
              <dd className="hero__fact-label">{fact.label}</dd>
            </div>
          ))}
        </dl>

        <p className="hero__note">
          Забрать можно с мастерской: {site.address.full}, {site.hoursLine}. Доставка по Минску в
          пятницу, бесплатно {site.delivery.freeFromLabel}.
        </p>
      </div>

      <Marquee items={marqueeItems} />
    </section>
  );
}
