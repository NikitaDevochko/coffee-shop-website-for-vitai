/**
 * Блок «О нас».
 *
 * Текст и фотографии — одна сетка из двух колонок и двух строк:
 *   1-я строка: заголовок слева, подпись «Основатели» справа (по низу заголовка);
 *   2-я строка: оба абзаца слева, фотографии справа (начинаются на одном уровне
 *   с первым абзацем).
 * Сетка центрирована по экрану.
 */

import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { site } from "@/lib/content/site";

const founders = [
  { name: "Анна", src: "/img/Ann.webp", alt: "Анна, основательница обжарки «Кварта»" },
  { name: "Дмитрий", src: "/img/Dima.webp", alt: "Дмитрий, основатель обжарки «Кварта»" },
] as const;

export function About() {
  return (
    <section className="section section--about" id="about">
      <div className="section__inner">
        <div className="about">
          <div className="about__head">
            <SectionMarker />
            <h2 className="section__title">
              Кофе не становится
              <br />
              лучше со временем
            </h2>
          </div>

          <p className="about__label">Основатели</p>

          <div className="about__text">
            <Reveal delay={60}>
              <p className="text-info about__paragraph">
                Через две-три недели после обжарки из зерна уходит то, за что мы его покупаем:
                сначала цветы и бергамот в Эфиопии, потом карамель в Колумбии. Остаётся кофе —
                горячий и горький. Поэтому у нас нет склада с готовыми пачками: то, что не уехало на
                этой неделе, мы честно допиваем сами.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-info about__paragraph">
                В четверг с утра жарим. К вечеру фасуем и подписываем дату. В пятницу развозим. К вам
                зерно попадает на {site.freshWindow} —{" "}
                <strong>это и есть весь секрет, других нет</strong>.
              </p>
            </Reveal>
          </div>

          <div className="about__photos">
            {founders.map((founder, index) => (
              <Reveal key={founder.name} delay={index * 80}>
                <figure className="about__figure">
                  <Image
                    className="about__photo"
                    src={founder.src}
                    alt={founder.alt}
                    width={520}
                    height={520}
                    sizes="(min-width: 900px) 250px, 45vw"
                  />
                  <figcaption className="about__caption text-note">{founder.name}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
