# telegram-bot — уведомления о заявках «Кварты»

Подпроект 2 из 2. Отдельный сервис: long polling по API сайта, отправка карточки заявки
в чат менеджеров, свой локальный стейт доставки.

## Как работает
1. Раз в `POLL_INTERVAL_SECONDS` вызывает `GET {API_BASE_URL}/api/leads?after_id=<last_id>` с `X-Admin-Token`.
2. Формирует карточку (обложка + заголовок + описание) и отправляет в `TELEGRAM_CHAT_ID`.
3. Сохраняет `last_id` и историю попыток в `STATE_DB_URL` (свой SQLite, к БД сайта не подключается).

## Запуск
```
pip install -r requirements.txt
copy .env.example .env
python -m app.main
```

## Документы
- [STAGES.md](STAGES.md) — этапы разработки
- [../website/docs/API.md](../website/docs/API.md) — контракт API
- [DECISIONS.md](DECISIONS.md) — почему опрос, а не вебхук

Статус: скелет, код не реализован.