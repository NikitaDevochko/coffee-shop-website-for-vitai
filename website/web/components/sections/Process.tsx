/**
 * Блок «Процесс»: таблица шагов от обжарки до доставки.
 *
 * Тексты шагов перенесены из прежней панели «Как это устроено по дням» дословно.
 * Таблица без вертикальных линий, только горизонтальные 1px #473334 — см. CSS.
 */

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionMarker } from "@/components/ui/SectionMarker";

const steps = [
  {
    number: "01",
    day: "четверг",
    text: "Жарим партию — 5 кг за раз. На каждой пачке появляется дата обжарки.",
  },
  {
    number: "02",
    day: "четверг, вечер",
    text: "Фасуем по 50 г. Пачка закрывается сразу, чтобы зерно не выдыхалось раньше времени.",
  },
  {
    number: "03",
    day: "пятница",
    text: "Садимся в машину и развозим по Минску. От 50 BYN — бесплатно.",
  },
  {
    number: "04",
    day: "1–3 день",
    text: "Кофе у вас. Это и есть тот самый момент, когда он вкуснее всего.",
  },
] as const;

export function Process() {
  return (
    <Section id="process" tone="process">
      <div className="section__head">
        <div className="process__heading">
          <SectionMarker />
          <h2 className="section__title">Процесс</h2>
        </div>
        <p className="process__subtitle text-info">как мы работаем</p>
      </div>

      <Reveal>
        <table className="process__table">
          <tbody>
            {steps.map((step) => (
              <tr className="process__row" key={step.number}>
                <td className="process__cell process__cell--number">{step.number}</td>
                <td className="process__cell process__cell--day">{step.day}</td>
                <td className="process__cell process__cell--text text-info">{step.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </Section>
  );
}
