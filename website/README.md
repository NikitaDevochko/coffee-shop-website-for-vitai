# website — лендинг «Кварты» + приём заявок

Подпроект 1 из 2. Внутри два сервиса:

| Папка | Что это | Стек | Деплой |
|---|---|---|---|
| `web/` | лендинг | Next.js (App Router), Tailwind | Vercel |
| `api/` | приём и хранение заявок | Python FastAPI, SQLite | бесплатный хостинг с постоянным диском |

Потребитель данных API — подпроект 2, `../telegram-bot` (читает заявки по `X-Admin-Token`).

Документы: [STAGES.md](STAGES.md) · [docs/ANALYSIS.md](docs/ANALYSIS.md) · [docs/API.md](docs/API.md) · [docs/COPY.md](docs/COPY.md) · [docs/DECISIONS.md](docs/DECISIONS.md)

Статус: создан скелет, логика не реализована.