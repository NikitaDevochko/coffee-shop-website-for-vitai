"""Статическая проверка вёрстки без браузера: HTML + CSS.

Браузер в этой песочнице не запускается, поэтому структуру проверяем по
отрендеренному HTML, а визуальные свойства — по правилам CSS и наличию классов.
"""

from __future__ import annotations

import re
import sys
import urllib.request
from html.parser import HTMLParser

BASE = "http://127.0.0.1:3000"
CSS_PATH = (
    r"C:\Users\user\Desktop\coffee-shop-website-for-vitai\website\web\app\globals.css"
)

results: list[tuple[str, bool, str]] = []


def check(label: str, ok: bool, detail: object = "") -> None:
    text = detail if isinstance(detail, str) else ", ".join(str(d) for d in detail or [])
    results.append((label, ok, text))
    print(f"{'OK  ' if ok else 'FAIL'} {label}{' — ' + text if text else ''}")


with urllib.request.urlopen(BASE, timeout=120) as response:
    html = response.read().decode("utf-8")

css = open(CSS_PATH, encoding="utf-8").read()


class Collector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.stack: list[tuple[str, dict[str, str]]] = []
        self.order: list[str] = []
        self.items: list[dict[str, str]] = []
        self.imgs: list[str] = []
        self.buttons: list[str] = []
        self.tables = 0
        self.rows = 0
        self.cells = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = a.get("class", "")
        ident = a.get("id", "")
        if tag == "img":
            self.imgs.append(a.get("src", ""))
            return
        if tag in ("table",):
            self.tables += 1
        if tag == "tr":
            self.rows += 1
        if tag in ("td", "th"):
            self.cells += 1
        if "btn" in classes.split():
            self.buttons.append("btn")
        token = None
        if tag == "header":
            token = "header"
        elif "hero" == classes:
            token = "hero"
        elif ident == "about":
            token = "about"
        elif ident == "menu":
            token = "menu"
        elif ident == "process":
            token = "process"
        elif ident == "delivery":
            token = "delivery"
        elif ident == "lead":
            token = "lead"
        elif tag == "footer":
            token = "footer"
        if token and token not in self.order:
            self.order.append(token)
        self.items.append({"tag": tag, "class": classes, "id": ident})


collector = Collector()
collector.feed(html)

# --- 1. Порядок блоков ---
expected_order = ["header", "hero", "about", "menu", "process", "delivery", "lead", "footer"]
check(
    "порядок блоков как в ТЗ",
    collector.order == expected_order,
    " → ".join(collector.order),
)

# --- 2. Удаления ---
# Отдельной секции «Контакты» больше нет: id="contacts" теперь у футера,
# а значит проверяем отсутствие прежней секции по её классам.
check(
    "блок «Контакты» удалён",
    "contacts__card" not in html and "social-link" not in html and "hours__row" not in html,
    "",
)
check("бегущая строка удалена", "marquee" not in html, "")
check("цитата основателей удалена", "fresh__quote" not in html, "")
check("панель «по дням» удалена (в блоке «О нас»)", "timeline" not in html, "")
check("ряд цифр в «Доставке» удалён", 'class="facts"' not in html, "")
check("теги в карточках меню удалены", "coffee-note" not in html, "")

# --- 3. Контакты в футере ---
footer = re.search(r"<footer.*?</footer>", html, re.S)
footer_html = footer.group(0) if footer else ""
check(
    "в футере адрес и часы",
    "Короля, 9" in footer_html and "пн–пт 8:00–20:00" in footer_html,
    "",
)
check(
    "в футере ссылки на Telegram и Instagram",
    "t.me/n1kk1_tok" in footer_html and "instagram.com/nikki.tok" in footer_html,
    "",
)
check(
    "в футере подписи Telegram / Instagram, а не хэндлы",
    ">Telegram<" in footer_html
    and ">Instagram<" in footer_html
    and "@n1kk1_tok<" not in footer_html
    and "@nikki.tok<" not in footer_html,
    "",
)
check("в футере две иконки мессенджеров", footer_html.count("footer__icon") == 2, "")
check(
    "три колонки футера с жирными названиями",
    footer_html.count('class="footer__col"') == 3
    and all(x in footer_html for x in ["ВСЕ О НАС", "НАШИ ТОВАРЫ", "КОНТАКТЫ"]),
    "",
)
check(
    "в футере товары",
    all(x in footer_html for x in [
        "Эфиопия Иргачеффе", "Колумбия Уила", "Бразилия Серрадо", "Дрип-пакеты, ассорти",
    ]),
    "",
)
check("в футере линия и копирайт", "footer__divider" in footer_html and "© Kvarta 2026" in footer_html, "")
check("футер без кнопки «Оставить заявку»", "btn" not in footer_html, "")

# --- 4. Hero ---
hero = re.search(r'<section class="hero".*?</section>', html, re.S)
hero_html = hero.group(0) if hero else ""
check("hero использует img/hero.webp", "hero.webp" in hero_html, "")
check(
    "в hero один заголовок и кнопка «Перейти»",
    hero_html.count("<h1") == 1 and "Перейти" in hero_html,
    "",
)
check(
    "из hero убраны цифры партии и примечание",
    "hero__facts" not in hero_html and "hero__note" not in hero_html,
    "",
)

# --- 5. О нас: основатели ---
check(
    "в «О нас» фото Ann.png и Dima.jpg с подписями",
    "Ann.webp" in html and "Dima.webp" in html and "Анна" in html and "Дмитрий" in html,
    "",
)
check("надпись «Основатели» над фото", "about__label" in html and "Основатели" in html, "")

# --- 6. Меню ---
# next/image отдаёт картинки через /_next/image?url=... — ищем имя файла.
menu_order = re.findall(r'class="menu__photo"[^>]*src="([^"]+)"', html)
if not menu_order:
    menu_order = re.findall(r'<img[^>]*class="menu__photo"[^>]*src="([^"]+)"', html)
menu_files = [
    m.group(1) for p in menu_order if (m := re.search(r"(coff_\d+\.webp)", p))
]
check(
    "четыре картинки меню в порядке coff_1…coff_4",
    menu_files == ["coff_1.webp", "coff_2.webp", "coff_3.webp", "coff_4.webp"],
    menu_files,
)
check("меню содержит чередование (--reverse)", html.count("menu__item--reverse") == 2, "")
check(
    "подписка внутри блока «Меню»",
    re.search(r'id="menu".*?class="subscription"', html, re.S) is not None,
    "",
)
check("текст «Не знаете, что выбрать?» на месте", "Не знаете, что выбрать?" in html, "")

# --- 7. Процесс ---
check("таблица «Процесса» из 4 строк и 12 ячеек", collector.rows == 4 and collector.cells == 12,
      f"rows={collector.rows}, cells={collector.cells}")
check(
    "шаги процесса на месте",
    all(x in html for x in ["Жарим партию", "Фасуем по 50 г", "Садимся в машину", "Кофе у вас"]),
    "",
)
check("подзаголовок «как мы работаем»", "как мы работаем" in html, "")

# --- 8. Доставка ---
check(
    "две карточки доставки",
    html.count("delivery__card") >= 2 and "Доставка в пятницу" in html and "Самовывоз с мастерской" in html,
    "",
)

# --- 9. Форма ---
check(
    "поля имени, телефона, интереса и комментария",
    all(
        s in html
        for s in ['name="name"', 'name="phone"', 'name="intent"', 'name="comment"']
    ),
    "",
)
check("форма в правой колонке (.lead__grid)", "lead__grid" in html, "")

# --- 9. Закладки перед заголовками ---
markers = len(re.findall(r'class="section-marker"', html))
check(
    "закладка стоит перед каждым заголовком блоков",
    markers == 6,
    f"закладок: {markers} (О нас, Меню, Подписка, Процесс, Доставка, Заявка)",
)
first_marker = html.find('class="section-marker"')
first_h2 = html.find("<h2")
check(
    "закладка идёт до заголовка «О нас»",
    0 < first_marker < first_h2,
    f"маркер на позиции {first_marker}, первый h2 — {first_h2}",
)
check(
    "заголовок «О нас» с переносом строки",
    "Кофе не становится<br/>лучше со временем" in html
    or "Кофе не становится<br>лучше со временем" in html,
    "",
)

# --- 10. Шапка ---
nav = re.search(r'<nav class="header__nav".*?</nav>', html, re.S)
nav_html = nav.group(0) if nav else ""
nav_links = re.findall(r'class="header__link"[^>]*>([^<]+)<', html)
check(
    "4 ссылки в навигации",
    len(nav_links) == 4,
    nav_links,
)
check(
    "текст лого «Кварта» без фона",
    'class="header__logo">Кварта<' in html,
    "",
)
check(
    "телефон и адрес в правом блоке",
    "header__phone" in html and "header__contacts" in html and "+375 (29) 123-45-67" in html,
    "",
)

# --- 11. CSS: ключевые правила ---
css_checks = [
    # Шапка — фиксированный блок 50% ширины по центру.
    ("шапка фиксированная", r"\.header\s*\{[^}]*position:\s*fixed", 1),
    ("шапка шириной 50%", r"\.header\s*\{[^}]*width:\s*50%", 1),
    ("шапка по центру", r"\.header\s*\{[^}]*margin-inline:\s*auto", 1),
    ("шапка 20px от верхнего края", r"\.header\s*\{[^}]*top:\s*20px", 1),
    ("шапка — один белый блок-таблетка", r"\.header\s*\{[^}]*border-radius:\s*var\(--radius-pill\)", 1),
    ("шапка с фоном единого блока", r"\.header\s*\{[^}]*background-color:\s*var\(--color-white\)", 1),
    ("три части шапки в одну строку", r"\.header\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto", 1),
    ("одинаковый отступ у всех частей", r"\.header > \*\s*\{[^}]*padding:\s*8px 20px", 1),
    ("разделитель 1px цвета кнопки", r"\.header > \* \+ \*\s*\{[^}]*border-left:\s*1px solid var\(--color-brown\)", 1),
    ("лого по центру части", r"\.header__logo\s*\{[^}]*justify-content:\s*center", 1),
    ("лого тонкое бежевое капсом", r"\.header__logo\s*\{[^}]*color:\s*var\(--color-beige\)", 1),
    ("лого: font-weight 300", r"\.header__logo\s*\{[^}]*font-weight:\s*300", 1),
    ("лого: text-transform uppercase", r"\.header__logo\s*\{[^}]*text-transform:\s*uppercase", 1),
    ("лого: размер --fs-heading (с потолком clamp)", r"\.header__logo\s*\{[^}]*font-size:\s*clamp\(14px, 1\.5vw, var\(--fs-heading\)\)", 1),
    ("ссылки: размер --fs-info", r"\.header__link\s*\{[^}]*font-size:\s*var\(--fs-info\)", 1),
    ("ссылки жирные", r"\.header__link\s*\{[^}]*font-weight:\s*700", 1),
    ("телефон: размер --fs-info", r"\.header__phone\s*\{[^}]*font-size:\s*var\(--fs-info\)", 1),
    ("адрес: размер --fs-info", r"\.header__address\s*\{[^}]*font-size:\s*var\(--fs-info\)", 1),
    ("контакты в одну строку", r"\.header__contacts\s*\{[^}]*white-space:\s*nowrap", 1),
    ("контент сдвинут под фиксированную шапку", r"\.page__main\s*\{[^}]*padding-top:\s*var\(--header-h\)", 1),
    ("hero идёт под шапкой (высота от --header-h)", r"\.hero\s*\{[^}]*height:\s*calc\(100dvh - var\(--header-h\)\)", 1),
    ("hero: картинка заполняет блок", r"\.hero__image\s*\{[^}]*object-fit:\s*cover", 1),
    ("hero: скруглены нижние углы", r"\.hero\s*\{[^}]*border-radius:\s*0 0 var\(--radius\) var\(--radius\)", 1),
    ("hero: текст без фона", r"\.hero__card\s*\{[^}]*background", 0),
    ("hero: текст шириной 30%", r"\.hero__card\s*\{[^}]*width:\s*30%", 1),
    ("hero: текст цвета кнопки", r"\.hero__card\s*\{[^}]*color:\s*var\(--color-brown\)", 2),
    ("hero: без тени у текста", r"text-shadow", 0),
    ("hero: размер текста адаптивный (clamp)", r"\.hero__title\s*\{[^}]*font-size:\s*clamp\(", 1),
    ("hero: кнопка по центру блока", r"\.hero__cta\s*\{[^}]*left:\s*50%", 1),
    ("hero: отступ кнопки 20px снизу", r"\.hero__cta\s*\{[^}]*bottom:\s*20px", 2),
    ("меню: картинка 400×400", r"\.menu__photo\s*\{[^}]*width:\s*400px", 1),
    ("меню: зазор фото↔текст 60px", r"\.menu__item\s*\{[^}]*gap:\s*60px", 1),
    ("меню: блок информации до 500px", r"\.menu__body\s*\{[^}]*max-width:\s*500px", 1),
    ("меню: список центрирован", r"\.menu__list\s*\{[^}]*justify-content:\s*center", 1),
    ("меню: текст 30% ширины", r"\.menu__intro-text\s*\{[^}]*max-width:\s*30%", 1),
    ("меню: текст выключен вправо", r"\.menu__intro-text\s*\{[^}]*text-align:\s*right", 1),
    # --- Блок «О нас» и закладки разделов ---
    ("закладка: 24×6", r"\.section-marker\s*\{[^}]*width:\s*24px[^}]*height:\s*6px", 1),
    ("закладка зелёная #3b6f2a", r"--color-marker:\s*#3b6f2a", 1),
    ("закладка в строке с заголовком", r"\.about__head\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center", 1),
    ("абзацы «О нас» — 500px", r"\.about__paragraph\s*\{[^}]*max-width:\s*500px", 1),
    ("абзацы выключены по ширине", r"\.about__paragraph\s*\{[^}]*text-align:\s*justify", 1),
    ("«О нас»: сетка центрирована", r"\.about\s*\{[^}]*justify-content:\s*center", 1),
    ("«О нас»: 120px между текстом и фото", r"\.about\s*\{[^}]*column-gap:\s*120px", 1),
    ("«Основатели» по центру", r"\.about__label\s*\{[^}]*text-align:\s*center", 1),
    ("«Основатели» над картинками (2-я колонка)", r"\.about__label\s*\{[^}]*grid-column:\s*2", 1),
    ("фото в одной строке с первым абзацем", r"\.about__photos\s*\{[^}]*grid-row:\s*2", 1),
    ("фото основателей круглые", r"\.about__photo\s*\{[^}]*border-radius:\s*50%", 1),
    ("фото 250×250", r"\.about__photo\s*\{[^}]*width:\s*250px[^}]*height:\s*250px", 1),
    ("фото ближе друг к другу (gap 12px)", r"\.about__photos\s*\{[^}]*gap:\s*12px", 1),
    # Линия 1px используется дважды: между строками таблицы и как разделитель
    # перед подпиской. Проверяем именно правило таблицы.
    ("линия таблицы 1px", r"\.process__row \+ \.process__row\s*\{[^}]*border-top:\s*1px solid var\(--color-brown\)", 1),
    ("процесс: фон #f6f1e6 во всю ширину", r"\.section--process\s*\{[^}]*padding:\s*var\(--section-gap\) 0[^}]*background-color:\s*var\(--color-about\)", 1),
    ("процесс: нет карточки (без margin/радиуса)", r"\.section--process\s*\{[^}]*margin:", 0),
    ("процесс: номера размером hero", r"\.process__cell--number\s*\{[^}]*font-size:\s*var\(--fs-hero\)", 1),
    ("процесс: номера тонкие", r"\.process__cell--number\s*\{[^}]*font-weight:\s*300", 1),
    ("процесс: дни размером заголовка", r"\.process__cell--day\s*\{[^}]*font-size:\s*var\(--fs-heading\)", 1),
    ("процесс: дни капсом", r"\.process__cell--day\s*\{[^}]*text-transform:\s*uppercase", 1),
    ("процесс: контент по центру по вертикали", r"\.process__cell\s*\{[^}]*vertical-align:\s*middle", 1),
    ("процесс: первая колонка 25%", r"\.process__cell--number\s*\{[^}]*width:\s*25%", 1),
    ("процесс: вторая колонка 25%", r"\.process__cell--day\s*\{[^}]*width:\s*25%", 1),
    ("процесс: третья колонка 50%", r"\.process__cell--text\s*\{[^}]*width:\s*50%", 1),
    ("процесс: вторая колонка тонкая", r"\.process__cell--day\s*\{[^}]*font-weight:\s*300", 1),
    ("процесс: номера полупрозрачные", r"\.process__cell--number\s*\{[^}]*opacity:\s*0\.7", 1),
    ("карточки доставки растянуты", r"\.delivery__card\s*\{[^}]*height:\s*100%", 1),
    ("фон подписки — фон меню (наследуется)", r"\.section--menu\s*\{[^}]*background-color", 1),
    ("подписка: карточки по 40%", r"\.subscription__body\s*\{[^}]*grid-template-columns:\s*40% 40%", 1),
    ("подписка: цена вдвое больше hero", r"--fs-price:\s*144px", 1),
    ("подписка: BYN увеличен", r"\.subscription__price-currency\s*\{[^}]*font-size:\s*calc\(var\(--fs-note\) \* 2\)", 1),
    ("подписка: отступ между карточками 80px", r"\.subscription__body\s*\{[^}]*gap:\s*80px", 1),
    ("подписка: карточки центрированы", r"\.subscription__body\s*\{[^}]*justify-content:\s*center", 1),
    ("подписка: карточки белые", r"\.subscription__card\s*\{[^}]*background-color:\s*var\(--color-white\)", 1),
    ("подписка: контент по левому краю", r"\.subscription__card\s*\{[^}]*text-align:\s*left", 1),
    ("подписка: карточки одной высоты (stretch)", r"\.subscription__body\s*\{[^}]*align-items:\s*stretch", 0),
    ("подписка: пункты с точкой-маркером", r"\.subscription__item::before\s*\{[^}]*border-radius:\s*50%", 1),
    ("подписка: кнопка по центру", r"\.subscription__action\s*\{[^}]*justify-content:\s*center", 1),
    ("модальное окно есть", r"\.modal\s*\{[^}]*position:\s*fixed", 1),
    ("футер: три колонки с отступом 180px", r"\.footer__columns\s*\{[^}]*gap:\s*180px", 1),
    ("футер: текст колонок влево", r"\.footer__col\s*\{[^}]*justify-items:\s*start", 1),
    ("футер: иконка слева от ссылки", r"\.footer__icon\s*\{[^}]*width:\s*18px", 1),
    ("футер: колонки по центру", r"\.footer__columns\s*\{[^}]*justify-content:\s*center", 1),
    ("футер: названия колонок жирным", r"\.footer__title\s*\{[^}]*font-weight:\s*700", 1),
    ("футер: ссылки без подчёркивания", r"\.footer__link\s*\{[^}]*text-decoration:\s*none", 1),
    ("футер: линия с учётом отступов X", r"\.footer\s*\{[^}]*padding:\s*var\(--section-gap\) var\(--pad-x\)", 1),
    ("футер: копирайт 70%", r"\.footer__copyright\s*\{[^}]*opacity:\s*0\.7", 1),
    ("фон формы #f6f1e6", r"\.lead__card\s*\{[^}]*background-color:\s*var\(--color-about\)", 1),
    ("имя и телефон выровнены по верху", r"\.form__grid\s*\{[^}]*align-items:\s*start", 1),
    ("поля не растягивают строки", r"\.field\s*\{[^}]*align-content:\s*start", 1),
    ("одинаковая высота инпутов", r"\.field__input\s*\{[^}]*height:\s*44px", 1),
]
for label, pattern, expected in css_checks:
    found = len(re.findall(pattern, css, re.S))
    check(f"CSS: {label}", found == expected, f"найдено {found}")

# --- 12. Ассеты существуют ---
import pathlib

img_dir = pathlib.Path(
    r"C:\Users\user\Desktop\coffee-shop-website-for-vitai\website\web\public\img"
)
missing = [p for p in ["hero.webp", "coff_1.webp", "coff_2.webp", "coff_3.webp", "coff_4.webp",
                       "Ann.webp", "Dima.webp"] if not (img_dir / p).is_file()]
check("все 7 ассетов в webp на месте", not missing, ", ".join(missing) if missing else "")

failed = [r for r in results if not r[1]]
print(f"\nитог: {len(results) - len(failed)}/{len(results)} проверок пройдено")
sys.exit(1 if failed else 0)
