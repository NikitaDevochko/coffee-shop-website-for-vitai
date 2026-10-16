# Деплой подпроекта website

1. **web/ (Vercel).** Root Directory = `website/web`. Переменные: `NEXT_PUBLIC_API_BASE_URL`,
   `NEXT_PUBLIC_SITE_URL`. Домен и HTTPS — автоматом.
2. **api/ (FastAPI).** Хостинг с постоянным диском (SQLite). Переменные из `api/.env.example`:
   обязательно `CORS_ORIGINS` с доменом Vercel и `ADMIN_API_TOKEN`.
   Команда: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. **Проверка после деплоя:** `/healthz`, отправка формы с телефона, доставка заявки в бота.