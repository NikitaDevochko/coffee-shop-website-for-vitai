"""Проверка требований брифа к форме (локальный прогон против запущенного API)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
ADMIN = "dev-local-token-kvarta"


def call(path: str, payload: dict | None = None, token: str | None = None) -> tuple[int, str]:
    url = BASE + path
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(url, data=data, method="POST" if data else "GET")
    if data:
        request.add_header("Content-Type", "application/json; charset=utf-8")
    if token:
        request.add_header("X-Admin-Token", token)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8")


def lead(phone: str, intent: str = "question", name: str = "Пётр", rid: str = "x") -> dict:
    return {
        "name": name,
        "phone": phone,
        "intent": intent,
        "comment": "проверка",
        "client_request_id": rid,
        "source": {
            "page_url": "https://kvarta.by/",
            "referrer": "https://l.instagram.com/",
            "utm_source": "instagram",
            "form_id": "lead-hero",
        },
    }


CASES = [
    ("российский номер", lead("+7 999 123-45-67", rid="t7")),
    ("неизвестный код", lead("+375 11 123-45-67", rid="t8")),
    ("слишком короткий", lead("+375 29 123", rid="t9")),
    ("мусор", lead("не телефон", rid="t10")),
    ("пустое имя", {**lead("+375291234567", rid="t11"), "name": ""}),
    ("неверный intent", {**lead("+375291234567", rid="t12"), "intent": "banana"}),
    ("нет телефона", {k: v for k, v in lead("+375291234567", rid="t13").items() if k != "phone"}),
]

print("=== ОШИБКИ ВАЛИДАЦИИ (ожидаем 422 и понятный message_ru) ===")
for label, payload in CASES:
    status, body = call("/api/lead", payload)
    try:
        parsed = json.loads(body)
        message = parsed.get("error", {}).get("message_ru", "<НЕТ message_ru>")
        fields = parsed.get("error", {}).get("fields", {})
    except Exception:
        message, fields = f"<НЕ JSON: {body[:120]!r}>", {}
    print(f"[{label}] {status} -> {message} | fields={fields}")

print()
print("=== ВЫДАЧА ДЛЯ БОТА ===")
status, body = call("/api/leads?after_id=0&limit=50")
print(f"без токена: {status} (ожидаем 401)")
status, body = call("/api/leads?after_id=0&limit=50", token="wrong")
print(f"неверный токен: {status} (ожидаем 401)")
status, body = call("/api/leads?after_id=0&limit=50", token=ADMIN)
print(f"верный токен: {status}")
if status == 200:
    page = json.loads(body)
    print(f"  заявок: {len(page['items'])} next_after_id={page['next_after_id']} has_more={page['has_more']}")
    for item in page["items"]:
        print(f"  id={item['id']} tel={item['phone']} intent={item['intent']} source={item['source']}")
    ids = [i["id"] for i in page["items"]]
    print(f"  дублей id: {'НЕТ' if len(ids) == len(set(ids)) else 'ЕСТЬ — ОШИБКА'}")

print()
print("=== CORS ПРЕФЛАЙТ ===")
request = urllib.request.Request(BASE + "/api/lead", method="OPTIONS")
request.add_header("Origin", "http://localhost:3000")
request.add_header("Access-Control-Request-Method", "POST")
request.add_header("Access-Control-Request-Headers", "content-type")
try:
    with urllib.request.urlopen(request, timeout=20) as response:
        allow = response.headers.get("access-control-allow-origin")
        print(f"preflight {response.status} allow-origin={allow}")
except urllib.error.HTTPError as exc:
    print(f"preflight {exc.code}: {exc.headers.get('access-control-allow-origin')}")

sys.exit(0)
