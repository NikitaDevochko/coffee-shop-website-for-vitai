import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { site } from "@/lib/content/site";

const days = [
  {
    day: "четверг",
    text: "Жарим партию — 5 кг за раз. На каждой пачке появляется дата обжарки.",
  },
  {
    day: "четверг, вечер",
    text: "Фасуем по 50 г. Пачка закрывается сразу, чтобы зерно не выдыхалось раньше времени.",
  },
  {
    day: "пятница",
    text: "Садимся в машину и развозим по Минску. От 50 BYN — бесплатно.",
  },
  {
    day: "1–3 день",
    text: "Кофе у вас. Это и есть тот самый момент, когда он вкуснее всего.",
  },
];

export function Freshness() {
  return (
    <Section
      id="freshness"
      tone="paper"
      eyebrow="Почему свежесть"
      title="Кофе не становится лучше со временем"
      lead="Это не про снобизм, а про вкус: у зерна есть окно, когда оно раскрывается. Мы работаем внутри этого окна."
    >
      <div className="fresh">
        <div className="fresh__text">
          <Reveal delay={60}>
            <p className="fresh__paragraph">
              Через две-три недели после обжарки из зерна уходит то, за что мы его покупаем: сначала
              цветы и бергамот в Эфиопии, потом карамель в Колумбии. Остаётся кофе — горячий и
              горький. Поэтому у нас нет склада с готовыми пачками: то, что не уехало на этой
              неделе, мы честно допиваем сами.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <p className="fresh__paragraph">
              В четверг с утра жарим. К вечеру фасуем и подписываем дату. В пятницу развозим. К вам
              зерно попадает на {site.freshWindow} —{" "}
              <strong>это и есть весь секрет, других нет</strong>.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <blockquote className="fresh__quote">
              <p>
                Мы оба работали бариста и устали объяснять гостям, почему в баре кофе вкусный, а
                дома — нет. Обычно дело не в технике, а в зерне, которому месяц. Так и появилась
                «Кварта».
              </p>
              <footer className="fresh__author">Аня и Дмитрий, основатели</footer>
            </blockquote>
          </Reveal>
        </div>

        <Reveal className="fresh__aside" delay={90}>
          <div className="panel panel--note">
            <h3 className="panel__title">Как это устроено по дням</h3>
            <ol className="timeline">
              {days.map((item) => (
                <li className="timeline__item" key={item.day}>
                  <span className="timeline__day">{item.day}</span>
                  <span className="timeline__text">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
