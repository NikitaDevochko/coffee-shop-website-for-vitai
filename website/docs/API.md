# Контракт API (website/api ↔ telegram-bot)

## POST /api/lead — приём заявки

Заголовки: `Content-Type: application/json`, опционально `X-Request-Id`.

```json
{
  "name": "Аня",
  "phone": "+375291234567",
  "intent": "subscription",
  "comment": "нужна доставка в пятницу",
  "position": "ethiopia-yirgacheffe",
  "client_request_id": "b1f5c0e2-...",
  "source": {
    "page_url": "https://kvarta.by/?utm_source=instagram",
    "referrer": "https://l.instagram.com/",
    "utm_source": "instagram",
    "utm_medium": "social",
    "utm_campaign": "oct_roast",
    "form_id": "lead-hero",
    "cta_variant": "hero"
  }
}
```

`intent` — одно из: `subscription` | `one_time` | `question`.

Успех — `201`:

```json
{ "id": 42, "duplicate": false, "message_ru": "Заявка принята. Перезвоним в рабочее время." }
```

Повтор того же нормализованного номера в течение `LEAD_DEDUP_WINDOW_MINUTES` (10) или
повтор с уже использованным `client_request_id` — `200`:

```json
{ "id": 42, "duplicate": true, "message_ru": "Заявка уже принята — мы вам перезвоним." }
```

Ошибки валидации — `422`:

```json
{
  "error": {
    "code": "invalid_phone",
    "message_ru": "Похоже, это не белорусский номер. Нужен формат +375 (29) 123-45-67.",
    "fields": { "phone": "only_by_numbers" }
  }
}
```

Прочие коды: `429` — слишком много отправок с одного IP, `503` — БД недоступна
(фронт показывает «не получилось отправить, попробуйте ещё раз», не теряя введённые данные).

## GET /api/leads — выдача заявок боту

Заголовок: `X-Admin-Token: <ADMIN_API_TOKEN>`.

`GET /api/leads?after_id=0&limit=50` → `200`

```json
{
  "items": [
    {
      "id": 42,
      "created_at": "2025-10-13T12:00:00+03:00",
      "name": "Аня",
      "phone": "+375291234567",
      "intent": "subscription",
      "comment": "нужна доставка в пятницу",
      "position": "ethiopia-yirgacheffe",
      "source": { "utm_source": "instagram", "page_url": "..." }
    }
  ],
  "next_after_id": 42,
  "has_more": false
}
```

Курсор (`after_id`) — по возрастанию `id`: бот хранит последний обработанный id у себя
и не зависит от часов. Ошибка авторизации — `401`.

## Инварианты
- Телефон в ответах всегда в нормализованном виде `+375XXXXXXXXX`.
- Заявка создаётся только `POST /api/lead`; `GET` ничего не меняет.
- Формат ошибок одинаков для всех эндпоинтов (`schemas/common.py`).