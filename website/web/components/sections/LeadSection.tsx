import { LeadForm } from "@/components/form/LeadForm";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { site } from "@/lib/content/site";

const steps = [
  "Перезвоним в рабочее время: уточним вкус, помол и объём.",
  "Договоримся, когда привезти, — или когда вам удобно забрать с ул. Короля, 9.",
  "В пятницу привезём свежую пачку. Оплата при получении.",
];

export function LeadSection() {
  return (
    <Section
      id="lead"
      tone="paper"
      eyebrow="Заявка"
      title="Напишите — соберём кофе под вас"
      lead="Имя и телефон — всё, что нужно. Остальное уточним голосом, это быстрее, чем переписка."
    >
      <div className="lead">
        <Reveal className="lead__aside">
          <h3 className="lead__aside-title">Что будет дальше</h3>
          <ol className="lead__steps">
            {steps.map((step) => (
              <li className="lead__step" key={step}>
                {step}
              </li>
            ))}
          </ol>
          <p className="lead__aside-note">
            Если это не заказ, а вопрос — так и напишите, ответим в мессенджере и ничего не будем
            навязывать.
          </p>
          <p className="lead__aside-note">
            {site.address.full} · {site.hoursLine}
          </p>
        </Reveal>

        <Reveal className="lead__card" delay={80}>
          <LeadForm formId="lead-form" ctaVariant="lead-section" />
        </Reveal>
      </div>
    </Section>
  );
}
