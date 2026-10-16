import type { Metadata } from "next";

import { Button } from "@/components/ui/Button";
import { site } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Заявка принята",
  description: "Заявка ушла в мастерскую «Кварта». Перезвоним в рабочее время.",
  robots: { index: false, follow: false },
};

/**
 * Отдельная страница «спасибо» — на случай, если заявку отправляют по прямой
 * ссылке или менеджер даёт её в переписке. Основной сценарий — состояние успеха
 * прямо в форме (components/form/LeadForm.tsx).
 */
export default function ThanksPage() {
  return (
    <main className="thanks">
      <div className="container thanks__inner">
        <p className="eyebrow">Заявка</p>
        <h1 className="thanks__title">Заявка у нас</h1>
        <p className="thanks__text">
          Перезвоним в рабочее время: {site.hoursLine}. Если удобнее письменно — напишите в{" "}
          {site.social.telegram.label} ({site.social.telegram.handle}), там отвечаем в течение
          рабочего дня.
        </p>
        <p className="thanks__text">
          Мастерская: {site.address.full}. Забрать заказ можно в те же часы, что и позвонить.
        </p>
        <div className="thanks__actions">
          <Button href="/">Вернуться на главную</Button>
          <Button
            href={site.social.telegram.url}
            variant="secondary"
            target="_blank"
            rel="noreferrer noopener"
          >
            Написать в {site.social.telegram.label.toLowerCase()}
          </Button>
        </div>
      </div>
    </main>
  );
}
