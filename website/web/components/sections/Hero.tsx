/**
 * Hero: блок на всю высоту экрана, картинка заполняет его целиком (фокус справа),
 * поверх — текст без фона слева и кнопка «Перейти» у нижнего края.
 *
 * Картинка абсолютная (fill), поэтому высоту блока задаёт CSS, а не её пропорции:
 * иначе кнопка уезжала бы за пределы экрана и не была видна сразу.
 */

import Image from "next/image";

import { ScrollButton } from "@/components/ui/ScrollButton";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__media">
        <Image
          src="/img/hero.webp"
          alt="Обжарка кофе «Кварта»"
          fill
          priority
          sizes="100vw"
          className="hero__image"
        />
      </div>

      <div className="hero__card">
        <h1 className="hero__title">Обжариваем в четверг — в пятницу уже у вас</h1>
      </div>

      <ScrollButton targetId="about" className="hero__cta">
        Перейти
      </ScrollButton>
    </section>
  );
}
