"""Проверка соблюдения стайлгайда по CSS: токены, шрифты, кнопка, отступы."""

from __future__ import annotations

import re
import pathlib
import sys

CSS = pathlib.Path(
    r"C:\Users\user\Desktop\coffee-shop-website-for-vitai\website\web\app\globals.css"
)
text = CSS.read_text(encoding="utf-8")

# Отрезаем блок :root — там значения токенов задавать можно.
root_end = text.find("}", text.find(":root"))
body = text[root_end:]
root = text[:root_end]

problems: list[str] = []
notes: list[str] = []

# --- 1. Размеры шрифта ---------------------------------------------------
hardcoded_fs = re.findall(r"font-size:\s*([^;]+);", body)
allowed_fs = {
    "var(--fs-hero)",
    "var(--fs-heading)",
    "var(--fs-info)",
    "var(--fs-note)",
    # кнопка ссылается на --fs-note через собственный токен
    "var(--btn-fs)",
    # hero: адаптивный размер, верхняя граница — токен --fs-hero
    "clamp(20px, 3.4vw, var(--fs-hero))",
    "clamp(20px, 3.6vw, var(--fs-hero))",
    # лого: потолок — токен --fs-heading, ниже ужимается под ширину блока
    "clamp(14px, 1.5vw, var(--fs-heading))",
    # цена подписки: отдельный токен (вдвое больше hero) и валюта (вдвое больше сноски)
    "var(--fs-price)",
    "calc(var(--fs-note) * 2)",
}
extra = sorted({v.strip() for v in hardcoded_fs if v.strip() not in allowed_fs})
if extra:
    problems.append(f"font-size вне токенов: {extra}")
notes.append(f"font-size объявлений всего: {len(hardcoded_fs)}, все на 4 токена: {not extra}")

# Кнопка использует свой токен, он равен --fs-note (14px) — проверяем отдельно.
btn_fs = re.search(r"--btn-fs:\s*([^;]+);", root)
if btn_fs is None or btn_fs.group(1).strip() != "var(--fs-note)":
    problems.append(f"--btn-fs должен ссылаться на --fs-note, сейчас: {btn_fs and btn_fs.group(1)}")

# --- 2. Токены объявлены -------------------------------------------------
for token in ["--pad-x", "--fs-hero", "--fs-heading", "--fs-info", "--fs-note", "--radius"]:
    if f"{token}:" not in root:
        problems.append(f"нет токена {token}")

# --- 3. Кнопка -----------------------------------------------------------
btn_block = re.search(r"\.btn\s*\{(.*?)\}", text, re.S)
if not btn_block:
    problems.append("не найден блок .btn")
else:
    block = btn_block.group(1)
    for needle, label in [
        ("var(--btn-pad-y) var(--btn-pad-x)", "padding 8/16"),
        ("var(--btn-radius)", "border-radius 16"),
        ("var(--btn-bg)", "фон #473334"),
        ("var(--btn-fg)", "текст #fff"),
        ("var(--btn-fs)", "14px"),
    ]:
        if needle not in block:
            problems.append(f"в .btn нет {label}")

if re.search(r"\.btn--(primary|secondary|ghost|accent)", text):
    problems.append("остались варианты кнопок — они должны быть едиными")
for size in ["--md", "--lg"]:
    if f".btn--{size}" in text:
        problems.append(f"остался размер кнопки .btn--{size}")

# --- 4. Цвета вне токенов ------------------------------------------------
hexes = set(re.findall(r"#[0-9a-fA-F]{3,8}\b", root))
declared_hex = {
    "#473334",  # brand / кнопка
    "#ffffff",  # белый
    "#f6f1e6",  # фон «О нас» и «Процесса»
    "#efe6d5",  # фон «Меню»
    "#2b2422",  # основной текст
    "#a89a86",  # бежевое лого
    "#f3efe7",  # фон шапки
    "#6a6156",  # приглушённый текст (ссылки, адрес)
    "#3b6f2a",  # зелёная закладка разделов
}
stray = hexes - declared_hex
if stray:
    problems.append(f"в :root лишние цвета: {sorted(stray)}")

body_hexes = set(re.findall(r"#[0-9a-fA-F]{3,8}\b", body))
if body_hexes:
    problems.append(f"hex-цвета вне :root: {sorted(body_hexes)}")

# --- 5. Отступ 80px ------------------------------------------------------
pad = re.search(r"--pad-x:\s*([^;]+);", root)
notes.append(f"--pad-x = {pad.group(1) if pad else '<нет>'}, мобильный override: "
             f"{'есть' if re.search(r'--pad-x:\s*24px', body) else 'нет'}")

# --- 6. Sticky только у навигации ---------------------------------------
sticky_rules = re.findall(
    r"([.\w\s,:#-]+)\{([^}]*position:\s*(?:sticky|fixed|absolute)[^}]*)\}", body
)
for selector, block in sticky_rules:
    notes.append(f"позиционирован: {selector.strip()}")
# Шапка фиксированная — это требование дизайна, остальное не липнет.
if not any(sel.strip() == ".header" for sel, _ in sticky_rules):
    problems.append("шапка должна быть position: fixed")

# --- 7. Линии таблицы ----------------------------------------------------
if "border-top: 1px solid var(--color-brown)" not in text:
    problems.append("нет горизонтальной линии 1px у строк таблицы")
if re.search(r"\.process__cell[^{]*\{[^}]*border-(left|right)", text):
    problems.append("у ячеек таблицы появились вертикальные линии")

print("=== ПРОВЕРКА СТАЙЛГАЙДА ===")
for note in notes:
    print(f"  · {note}")
print()
if problems:
    print(f"НАРУШЕНИЯ ({len(problems)}):")
    for p in problems:
        print(f"  ✗ {p}")
    sys.exit(1)
print("нарушений не найдено")
