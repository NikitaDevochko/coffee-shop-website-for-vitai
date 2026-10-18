/**
 * Закладка раздела: жирный прямоугольник 12×3 цвета кнопки перед заголовком.
 * Чисто визуальный маркер — не интерактивный, поэтому aria-hidden.
 */

export function SectionMarker() {
  return <span className="section-marker" aria-hidden="true" />;
}
