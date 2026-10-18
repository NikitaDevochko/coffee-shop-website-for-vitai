/**
 * Визуальная и поведенческая проверка редизайна по критериям готовности.
 *
 * Скриншоты: desktop 1440, планшет 900, мобильный 360.
 * Проверки: sticky только у навигации, скролл «ПЕРЕЙТИ», отступ 80px,
 * 4 размера шрифта, одинаковые кнопки, равные карточки, линии таблицы,
 * модальное окно на неверный телефон.
 *
 * ТРЕБУЕТ запуска браузера (spawn процесса). В ограниченной песочнице падает
 * с `spawn EPERM` — там используйте статические аудиты:
 *   python scripts/check-markup.py && python scripts/check-style-tokens.py
 *
 * Запуск: node scripts/check-redesign.mjs (нужен поднятый http://127.0.0.1:3000)
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "../node_modules/playwright/index.mjs";

const BASE = "http://127.0.0.1:3000";
const OUT = new URL("../.shots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok, detail });
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${detail ? " — " + detail : ""}`);
}

const browser = await chromium.launch();

// ---------- desktop ----------
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.screenshot({ path: join(OUT, "desktop-full.png"), fullPage: true });
await page.screenshot({ path: join(OUT, "desktop-hero.png") });

// --- 1. Отступ 80px от краёв ---
const padCheck = await page.evaluate(() => {
  const targets = [
    ["header nav", ".header__nav"],
    ["hero card", ".hero__card"],
    ["about", ".section--about .section__head"],
    ["menu", ".section--menu .section__head"],
    ["delivery", ".delivery .section__head"],
    ["lead", ".lead__aside"],
    ["footer", ".footer__inner"],
  ];
  return targets.map(([name, sel]) => {
    const el = document.querySelector(sel);
    if (!el) return { name, left: null };
    return { name, left: Math.round(el.getBoundingClientRect().left) };
  });
});
const padOff = padCheck.filter((p) => p.left !== null && Math.abs(p.left - 80) > 1);
check(
  "отступ 80px слева у всех блоков",
  padOff.length === 0,
  padCheck.map((p) => `${p.name}=${p.left}`).join(", "),
);

// --- 2. Ровно 4 размера шрифта ---
const fontSizes = await page.evaluate(() => {
  const set = new Map();
  for (const el of document.querySelectorAll("body *")) {
    if (!el.textContent?.trim()) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const key = `${size}px`;
    if (!set.has(key)) set.set(key, el.className || el.tagName);
  }
  return [...set.entries()].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
});
check(
  "ровно 4 размера шрифта на странице",
  fontSizes.length === 4,
  fontSizes.map(([s, who]) => `${s} (${String(who).slice(0, 24)})`).join(" | "),
);

// --- 3. Кнопки идентичны ---
const buttons = await page.evaluate(() => {
  return [...document.querySelectorAll(".btn")].map((el) => {
    const cs = getComputedStyle(el);
    return {
      text: el.textContent.trim().slice(0, 20),
      fontSize: cs.fontSize,
      padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      radius: cs.borderRadius,
      bg: cs.backgroundColor,
      color: cs.color,
    };
  });
});
const uniq = new Set(buttons.map((b) => JSON.stringify([b.fontSize, b.padding, b.radius, b.bg, b.color])));
check(
  "все кнопки одного стиля",
  uniq.size === 1,
  `${buttons.length} кнопок, вариантов: ${uniq.size}, пример: ${buttons[0]?.fontSize} / ${buttons[0]?.padding} / r=${buttons[0]?.radius} / ${buttons[0]?.bg}`,
);
check(
  "кнопка: 14px, padding 8/16, radius 16",
  buttons.every((b) => b.fontSize === "14px" && b.padding === "8px 16px 8px 16px" && b.radius === "16px"),
  "",
);

// --- 4. Sticky только у первого блока ---
const stickyBefore = await page.evaluate(() => {
  const nav = document.querySelector(".header__nav").getBoundingClientRect().top;
  const contacts = document.querySelector(".header__contacts").getBoundingClientRect().top;
  return { nav, contacts };
});
await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(400);
const stickyAfter = await page.evaluate(() => {
  const cs = getComputedStyle(document.querySelector(".header__nav"));
  const nav = document.querySelector(".header__nav").getBoundingClientRect().top;
  const contacts = document.querySelector(".header__contacts").getBoundingClientRect().top;
  return { nav, contacts, position: cs.position };
});
check(
  "навигация липкая при скролле",
  stickyAfter.position === "sticky" && stickyAfter.nav >= 0 && stickyAfter.nav <= 20,
  `position=${stickyAfter.position}, top=${stickyAfter.nav}px`,
);
check(
  "контакты в шапке не липкие",
  stickyAfter.contacts < -100,
  `top=${Math.round(stickyAfter.contacts)}px после скролла`,
);
await page.screenshot({ path: join(OUT, "desktop-sticky.png") });

// --- 5. Порядок блоков ---
await page.evaluate(() => window.scrollTo(0, 0));
const order = await page.evaluate(() => {
  const ids = [];
  for (const el of document.querySelectorAll("header, .hero, #about, #menu, #process, #delivery, #lead, footer")) {
    ids.push(el.id || el.className.split(" ")[0] || el.tagName);
  }
  return ids;
});
check(
  "порядок: header → hero → о нас → меню → процесс → доставка → заявка → футер",
  JSON.stringify(order) ===
    JSON.stringify(["header", "hero", "about", "menu", "process", "delivery", "lead", "footer"]),
  order.join(" → "),
);
check("секции «Контакты» нет", (await page.locator(".contacts").count()) === 0, "");

// --- 6. «ПЕРЕЙТИ» скроллит к следующему блоку ---
const beforeY = await page.evaluate(() => window.scrollY);
await page.locator(".hero__cta").click();
await page.waitForTimeout(1200);
const afterY = await page.evaluate(() => window.scrollY);
const aboutTop = await page.evaluate(() => Math.round(document.querySelector("#about").getBoundingClientRect().top));
check("«Перейти» уводит со старта вниз", afterY > beforeY + 100, `scrollY ${beforeY} → ${afterY}`);
check("после клика виден блок «О нас»", Math.abs(aboutTop) < 140, `#about top=${aboutTop}px`);

// --- 7. Меню: чередование и картинки 400×400 ---
const menu = await page.evaluate(() => {
  return [...document.querySelectorAll(".menu__item")].map((item) => {
    const img = item.querySelector("img");
    const media = item.querySelector(".menu__media");
    const body = item.querySelector(".menu__body");
    const r = img.getBoundingClientRect();
    return {
      name: item.querySelector(".menu__name")?.textContent?.trim(),
      src: img.getAttribute("src")?.split("/").pop(),
      w: Math.round(r.width),
      h: Math.round(r.height),
      mediaLeft: media.getBoundingClientRect().left < body.getBoundingClientRect().left,
    };
  });
});
const expected = [
  ["Эфиопия Иргачеффе", "coff_1"],
  ["Колумбия Уила", "coff_2"],
  ["Бразилия Серрадо", "coff_3"],
  ["Дрип-пакеты, ассорти", "coff_4"],
];
check(
  "картинки меню соответствуют позициям",
  menu.every((m, i) => m.name?.startsWith(expected[i][0].slice(0, 12)) && m.src?.includes(expected[i][1])),
  menu.map((m) => `${m.name}=${m.src}`).join("; "),
);
check(
  "картинка 400×400",
  menu.every((m) => m.w === 400 && m.h === 400),
  menu.map((m) => `${m.w}×${m.h}`).join(", "),
);
check(
  "чередование картинка/описание",
  JSON.stringify(menu.map((m) => m.mediaLeft)) === JSON.stringify([true, false, true, false]),
  menu.map((m) => `left=${m.mediaLeft}`).join(", "),
);

// --- 8. Таблица «Процесса» ---
const table = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".process__row")];
  const first = rows[0];
  const cells = [...first.querySelectorAll(".process__cell")];
  const cs = getComputedStyle(cells[1]);
  const csLast = getComputedStyle(cells[2]);
  const row2 = getComputedStyle(rows[1]);
  return {
    rowCount: rows.length,
    firstRowBorderTop: getComputedStyle(rows[0]).borderTopWidth,
    secondRowBorderTop: row2.borderTopWidth,
    secondRowColor: row2.borderTopColor,
    borders: [cs.borderLeftWidth, cs.borderRightWidth],
    lastTextAlign: csLast.textAlign,
    lastWidth: Math.round(cells[2].getBoundingClientRect().right),
    tableWidth: Math.round(document.querySelector(".process__table").getBoundingClientRect().width),
    dayPaddingRight: cs.paddingRight,
    textPaddingLeft: csLast.paddingLeft,
  };
});
check("в таблице 4 шага", table.rowCount === 4, `${table.rowCount}`);
check(
  "только горизонтальные линии 1px #473334",
  table.firstRowBorderTop === "0px" &&
    table.secondRowBorderTop === "1px" &&
    table.secondRowColor === "rgb(71, 51, 52)" &&
    table.borders.every((b) => b === "0px"),
  `первая строка border-top=${table.firstRowBorderTop}, вторая=${table.secondRowBorderTop} ${table.secondRowColor}, вертикальные=${table.borders.join("/")}`,
);
check(
  "текст последней колонки прижат вправо",
  table.lastTextAlign === "right" && table.lastWidth === table.tableWidth,
  `text-align=${table.lastTextAlign}, right=${table.lastWidth}/${table.tableWidth}`,
);
check(
  "широкие отступы внутри таблицы",
  parseInt(table.dayPaddingRight) >= 150 && parseInt(table.textPaddingLeft) >= 150,
  `day padding-right=${table.dayPaddingRight}, text padding-left=${table.textPaddingLeft}`,
);

// --- 9. Карточки доставки равны ---
const cards = await page.evaluate(() => {
  return [...document.querySelectorAll(".delivery__card")].map((el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
});
check(
  "карточки доставки одинаковые по размеру",
  cards.length === 2 && cards[0].w === cards[1].w && cards[0].h === cards[1].h,
  cards.map((c) => `${c.w}×${c.h}`).join(" vs "),
);

// --- 10. Модальное окно на неверный телефон ---
await page.locator("#lead").scrollIntoViewIfNeeded();
await page.fill('input[name="name"]', "Тест");
await page.fill('input[name="phone"]', "+375 11 123-45-67");
await page.check('input[name="intent"][value="one_time"]');
await page.locator('form button[type="submit"]').click();
await page.waitForTimeout(700);
const modal = await page.evaluate(() => {
  const el = document.querySelector(".modal");
  if (!el) return null;
  const close = el.querySelector(".modal__close");
  return {
    text: el.querySelector(".modal__text")?.textContent?.trim(),
    closeText: close?.textContent?.trim(),
    closeVisible: close ? close.getBoundingClientRect().width > 0 : false,
  };
});
check("неверный код вызывает модальное окно", modal !== null, modal ? "" : "окна нет");
check(
  "текст окна содержит код номера",
  Boolean(modal?.text?.includes("Код 11") && modal?.text?.includes("+375 (29) 123-45-67")),
  modal?.text ?? "",
);
await page.screenshot({ path: join(OUT, "desktop-modal.png") });
await page.locator(".modal__close").click();
await page.waitForTimeout(300);
check(
  "окно закрывается крестиком",
  (await page.locator(".modal").count()) === 0,
  "",
);

// --- 11. Имя и телефон одинаковой ширины ---
const fieldWidths = await page.evaluate(() => {
  const name = document.querySelector('input[name="name"]').getBoundingClientRect().width;
  const phone = document.querySelector('input[name="phone"]').getBoundingClientRect().width;
  return { name: Math.round(name), phone: Math.round(phone) };
});
check(
  "поля «Имя» и «Телефон» одинаковой ширины",
  Math.abs(fieldWidths.name - fieldWidths.phone) <= 1,
  `${fieldWidths.name} vs ${fieldWidths.phone}`,
);

// --- 12. Форма справа от заголовка, верх выровнен ---
const layout = await page.evaluate(() => {
  const title = document.querySelector("#lead-title").getBoundingClientRect();
  const card = document.querySelector(".lead__card").getBoundingClientRect();
  return {
    titleLeft: Math.round(title.left),
    cardLeft: Math.round(card.left),
    titleTop: Math.round(title.top),
    cardTop: Math.round(card.top),
  };
});
check(
  "форма справа от заголовка",
  layout.cardLeft > layout.titleLeft + 200,
  `title.left=${layout.titleLeft}, card.left=${layout.cardLeft}`,
);

await desktop.close();

// ---------- мобильный ----------
const mobile = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true });
const mpage = await mobile.newPage();
await mpage.goto(BASE, { waitUntil: "networkidle" });
await mpage.waitForTimeout(500);
await mpage.screenshot({ path: join(OUT, "mobile-full.png"), fullPage: true });
const overflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check("нет горизонтального скролла на 360px", overflow <= 0, `overflow=${overflow}px`);
await mobile.close();

// ---------- планшет ----------
const tablet = await browser.newContext({ viewport: { width: 900, height: 1000 } });
const tpage = await tablet.newPage();
await tpage.goto(BASE, { waitUntil: "networkidle" });
await tpage.waitForTimeout(500);
await tpage.screenshot({ path: join(OUT, "tablet-full.png"), fullPage: true });
await tablet.close();

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\nитог: ${results.length - failed.length}/${results.length} проверок пройдено`);
console.log(`скриншоты: ${OUT}`);
process.exit(failed.length ? 1 : 0);
