/**
 * Блок «Заявка»: заголовок и текст слева, форма справа, верх формы выровнен
 * по уровню заголовка.
 *
 * Содержимое (шаги «Что будет дальше», примечания) сохранено как было.
 */

import { LeadForm } from "@/components/form/LeadForm";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { site } from "@/lib/content/site";

const steps = [
  "Перезвоним в рабочее время: уточним вкус, помол и объём.",
  "Договоримся, когда привезти, — или когда вам удобно забрать с ул. Короля, 9.",
  "В пятницу привезём свежую пачку. Оплата при получении.",
];

export function LeadSection() {
  return (
    <section className="lead" id="lead" aria-labelledby="lead-title">
      <div className="lead__grid">
        <div className="lead__aside">
          <div className="lead__heading">
            <SectionMarker />
            <h2 className="section__title" id="lead-title">
              Напишите — соберём кофе под вас
            </h2>
          </div>
          <p className="text-info">
            Имя и телефон — всё, что нужно. Остальное уточним голосом, это быстрее, чем переписка.
          </p>

          <h3 className="lead__aside-title">Что будет дальше</h3>
          <ol className="lead__steps">
            {steps.map((step) => (
              <li className="lead__step text-info" key={step}>
                {step}
              </li>
            ))}
          </ol>
          <p className="lead__aside-note text-info">
            Если это не заказ, а вопрос — так и напишите, ответим в мессенджере и ничего не будем
            навязывать.
          </p>
        </div>

        <Reveal className="lead__card" delay={80}>
          <LeadForm formId="lead-form" ctaVariant="lead-section" />
        </Reveal>
      </div>
    </section>
  );
}
