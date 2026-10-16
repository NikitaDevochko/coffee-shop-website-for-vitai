# Деплой telegram-bot

Отдельный процесс. Варианты бесплатного размещения: любой хостинг с постоянным диском
(Render/Fly.io/Railway free tier) или собственный VPS. Нужен постоянный диск под `data/bot_state.db`.

Переменные — из `.env.example`. Команда: `python -m app.main`.

Проверка: заявка с сайта появляется в чате в пределах `POLL_INTERVAL_SECONDS`.