"""Финальная проверка: кросс-доменный POST как из браузера + healthcheck лендинга."""

from __future__ import annotations

import json
import urllib.request
import uuid

API = "http://127.0.0.1:8000"
WEB = "http://127.0.0.1:3000"
ORIGIN = "http://localhost:3000"


def post_as_browser(body: dict) -> tuple[int, dict, dict]:
    request = urllib.request.Request(
        API + "/api/lead",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        method="POST",
    )
    request.add_header("Content-Type", "application/json; charset=utf-8")
    # Браузер всегда присылает Origin для кросс-доменного POST.
    request.add_header("Origin", ORIGIN)
    request.add_header("Referer", WEB + "/")
    request.add_header("User-Agent", "Mozilla/5.0 browser-check")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            headers = dict(response.headers)
            return response.status, json.loads(response.read().decode()), headers
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode() or "{}"), dict(exc.headers)


body = {
    "name": "Кросс-домен",
    "phone": "+375 33 " + str(1000000 + __import__("random").randint(0, 8999999)),
    "intent": "one_time",
    "comment": "проверка CORS-пути из браузера",
    "position": "colombia-huila",
    "client_request_id": str(uuid.uuid4()),
    "source": {
        "page_url": WEB + "/?utm_source=yandex&utm_campaign=brand",
        "referrer": "https://yandex.by/",
        "utm_source": "yandex",
        "utm_campaign": "brand",
        "form_id": "lead-hero",
        "cta_variant": "hero",
    },
}

status, payload, headers = post_as_browser(body)
allow_origin = headers.get("Access-Control-Allow-Origin") or headers.get(
    "access-control-allow-origin"
)
print(f"POST /api/lead с Origin: {ORIGIN}")
print(f"  ответ: {status} {json.dumps(payload, ensure_ascii=False)}")
print(f"  Access-Control-Allow-Origin: {allow_origin}")
ok_cors = allow_origin == ORIGIN
print(f"  браузер примет ответ: {'да' if ok_cors else 'НЕТ — CORS не настроен'}")

print()
print("Проверка, что источник сохранился и виден боту:")
request = urllib.request.Request(API + "/api/leads?after_id=0&limit=200")
request.add_header("X-Admin-Token", "dev-local-token-kvarta")
with urllib.request.urlopen(request, timeout=30) as response:
    page = json.loads(response.read().decode())
mine = [i for i in page["items"] if i["name"] == "Кросс-домен"]
if mine:
    item = mine[-1]
    print(f"  id={item['id']} intent={item['intent']} position={item['position']}")
    print(f"  source={json.dumps(item['source'], ensure_ascii=False)}")
else:
    print("  НЕ НАЙДЕНО")

print()
with urllib.request.urlopen(WEB + "/api/health", timeout=60) as response:
    print(f"лендинг /api/health: {response.status} {response.read().decode()}")

raise SystemExit(0 if (status in (200, 201) and ok_cors) else 1)
