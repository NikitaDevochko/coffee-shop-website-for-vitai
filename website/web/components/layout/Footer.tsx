/**
 * Футер: три колонки — разделы сайта, товары и контакты.
 * Под колонками линия во всю ширину и копирайт по центру.
 *
 * В контактах показываем названия мессенджеров с белыми иконками,
 * а не голые ссылки и хэндлы.
 */

import { coffeePositions } from "@/lib/content/coffee";
import { site } from "@/lib/content/site";

/** Те же разделы, что в шапке. */
const SECTIONS = [
  { href: "#about", label: "О нас" },
  { href: "#menu", label: "Меню" },
  { href: "#process", label: "Процесс" },
] as const;

const products = coffeePositions.map((position) => position.name);

function TelegramIcon() {
  return (
    <svg
      className="footer__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      className="footer__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="footer" id="contacts">
      <div className="footer__inner">
        <div className="footer__columns">
          <nav className="footer__col" aria-label="Разделы сайта">
            <p className="footer__title">ВСЕ О НАС</p>
            <ul className="footer__list">
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <a className="footer__link text-info" href={section.href}>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <p className="footer__title">НАШИ ТОВАРЫ</p>
            <ul className="footer__list">
              {products.map((product) => (
                <li className="text-info" key={product}>
                  {product}
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <p className="footer__title">КОНТАКТЫ</p>
            <ul className="footer__list">
              <li className="text-info">{site.address.full}</li>
              <li className="text-info">{site.hoursLine}</li>
              <li>
                <a
                  className="footer__link text-info"
                  href={site.social.telegram.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <TelegramIcon />
                  <span>Telegram</span>
                </a>
              </li>
              <li>
                <a
                  className="footer__link text-info"
                  href={site.social.instagram.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <InstagramIcon />
                  <span>Instagram</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__divider" />

        <p className="footer__copyright text-note">© Kvarta 2026</p>
      </div>
    </footer>
  );
}
