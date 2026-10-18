/**
 * Шапка сайта: один белый блок-«таблетка» с тремя частями.
 *
 * Ссылки | лого | телефон с адресом — части разделены вертикальной линией
 * 1px цвета кнопки. Шапка скроллится целиком вместе со страницей:
 * никаких sticky/fixed, поэтому ничего не наезжает друг на друга.
 */

import { site } from "@/lib/content/site";

const NAV_LINKS = [
  { href: "#about", label: "О нас" },
  { href: "#menu", label: "Меню" },
  { href: "#process", label: "Процесс" },
  { href: "#contacts", label: "Контакты" },
] as const;

export function Header() {
  return (
    <header className="header">
      <nav className="header__nav" aria-label="Основная навигация">
        <ul className="header__links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a className="header__link" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="header__logo">{site.name}</p>

      <div className="header__contacts">
        <a className="header__phone" href={`tel:${site.phone.raw}`}>
          {site.phone.label}
        </a>
        <p className="header__address">{site.address.full}</p>
      </div>
    </header>
  );
}
