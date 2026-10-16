/**
 * Бегущая строка «обжарено в четверг — у вас в пятницу».
 *
 * Чистый CSS: две одинаковые ленты, вторая помечена aria-hidden, чтобы
 * скринридер не читал текст дважды. При prefers-reduced-motion анимация
 * выключается, лента переносится по строкам.
 */

export interface MarqueeProps {
  items: readonly string[];
  className?: string;
  /** Разделитель между фразами. */
  separator?: string;
}

export function Marquee({ items, className = "", separator = "·" }: MarqueeProps) {
  const group = (duplicate: boolean) => (
    <ul className="marquee__group" aria-hidden={duplicate || undefined}>
      {items.map((item, index) => (
        <li className="marquee__item" key={`${item}-${index}`}>
          {item}
          {index < items.length - 1 ? (
            <span className="marquee__sep" aria-hidden="true">
              {separator}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={["marquee", className].filter(Boolean).join(" ")}>
      <div className="marquee__track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
