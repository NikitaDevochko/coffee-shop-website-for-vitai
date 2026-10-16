# Кварта — тестовое задание (лендинг обжарки кофе + Telegram-бот)

Репозиторий содержит **два независимых подпроекта**, как и требуется по заданию.

| Подпроект | Папка | Что внутри | Стек |
|---|---|---|---|
| **1. Сайт** | [`website/`](website/) | `web/` — лендинг, `api/` — приём заявок | Next.js (App Router) + Tailwind · Python FastAPI · SQLite |
| **2. Telegram-бот** | [`telegram-bot/`](telegram-bot/) | сервис уведомлений о новых заявках | Python · aiogram 3 · long polling |

## Документы

- **[ANALYSIS.md](ANALYSIS.md)** — разбор требований брифа `kvarta-brief.pdf`, архитектура, этапы, чек-лист сдачи.
- [website/STAGES.md](website/STAGES.md) — этапы 0–7 по сайту (оценка ~4,5–5 ч).
- [telegram-bot/STAGES.md](telegram-bot/STAGES.md) — этапы B0–B5 по боту (оценка ~1 ч).
- [website/docs/API.md](website/docs/API.md) — контракт между сайтом и ботом.
- [website/docs/COPY.md](website/docs/COPY.md) — факты и тексты лендинга.
- [website/docs/DECISIONS.md](website/docs/DECISIONS.md), [telegram-bot/DECISIONS.md](telegram-bot/DECISIONS.md) — обоснование технических решений (в т.ч. выбор SQLite).

## Структура репозитория

```
coffee-shop-website-for-vitai/
├── ANALYSIS.md                  разбор брифа и план работ
├── README.md                    этот файл
│
├── website/                     ПОДПРОЕКТ 1: сайт
│   ├── README.md  STAGES.md
│   ├── docs/                    API.md · COPY.md · ANALYSIS.md · DECISIONS.md
│   ├── deploy/                  vercel.json + инструкция
│   │
│   ├── web/                     Next.js-фронтенд (деплой на Vercel)
│   │   ├── app/(landing)/       страница лендинга и «спасибо»
│   │   ├── app/api/health/      healthcheck фронта
│   │   ├── components/          sections/ (блоки лендинга) · form/ · ui/
│   │   ├── lib/                 api.ts · content/ · analytics/ · validation/
│   │   ├── public/img/          оптимизированные фото
│   │   └── tests/               Vitest + Playwright
│   │
│   └── api/                     FastAPI (деплой отдельно, постоянный диск)
│       ├── app/
│       │   ├── main.py  config.py
│       │   ├── api/             deps.py · routes/ (leads.py, health.py)
│       │   ├── models/          SQLAlchemy: lead.py
│       │   ├── schemas/         Pydantic: lead.py, common.py
│       │   ├── repositories/    доступ к данным
│       │   ├── services/        lead_service.py (валидация, дедуп) · notify_service.py
│       │   ├── middleware/      rate_limit.py · request_id.py
│       │   ├── db/              session.py · base.py
│       │   └── utils/           phone.py · logging.py
│       ├── migrations/          Alembic
│       ├── scripts/             seed_leads.py
│       └── tests/               pytest
│
└── telegram-bot/                ПОДПРОЕКТ 2: бот
    ├── README.md  STAGES.md  DECISIONS.md
    ├── app/
    │   ├── main.py  config.py
    │   ├── bot/                 dispatcher.py · handlers/
    │   ├── services/            poller.py · api_client.py · state_store.py · sender.py
    │   ├── templates/           lead_card.py
    │   ├── utils/               formatting.py · logging.py
    │   └── static/              обложка карточки заявки
    ├── deploy/
    └── tests/
```

## Как это работает

1. Посетитель заполняет форму на лендинге → `POST {API_BASE_URL}/api/lead`.
2. FastAPI нормализует и проверяет белорусский номер, отсекает повторы в течение 10 минут и
   сохраняет заявку в SQLite вместе с источником (`utm_*`, `referrer`, страница, форма).
3. `telegram-bot` опрашивает `GET /api/leads?after_id=…` с `X-Admin-Token` и отправляет
   карточку заявки (картинка + заголовок + описание) в чат менеджеров. Свой журнал доставки
   не даёт отправить заявку дважды.

## Быстрый старт

Проверено локально: API отвечает на `http://127.0.0.1:8000`, лендинг открывается на
`http://localhost:3000`, форма доходит до базы и до выдачи для бота.

```powershell
# 1. Бэкенд сайта (http://127.0.0.1:8000)
cd website\api
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env                   # ADMIN_API_TOKEN должен совпадать с ботом
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
#   схема SQLite создаётся на старте; alembic — следующий шаг (этап 3.1 плана)

# 2. Фронтенд (http://localhost:3000)
cd ..\web
pnpm install                             # .npmrc уже задаёт node-linker=hoisted
copy .env.example .env.local             # NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
pnpm dev

# 3. Бот (нужен токен от @BotFather)
cd ..\..\telegram-bot
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env                   # TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ADMIN_API_TOKEN
python -m app.main
```

### Проверка связки

```powershell
# контракт API: валидация номеров, дедупликация 10 минут, выдача для бота, CORS
cd website\api; .\.venv\Scripts\python.exe scripts\check_api_contract.py

# реальный клиентский код формы (lib/api.ts + attribution + phone) против запущенного API
cd website\web
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"; node scripts\check-form.mjs
```

Второй скрипт транспилирует настоящие `lib/*.ts` и вызывает `submitLead` с заглушкой
браузерного окружения — то есть проверяет тот же код, что уезжает в браузер.

### Особенности окружения, в котором всё это поднималось

- **`pnpm` версии 11** ставит пакеты в изолированный `node_modules`, и транзитивные зависимости
  `next` (`styled-jsx`) не оказываются в корне → `next dev` падает с
  `Cannot find module 'styled-jsx/package.json'`. Лечится файлом `website/web/.npmrc`
  с `node-linker=hoisted` (уже в репозитории).
- **`pip` в этом окружении зависает** (дочерние процессы с piped stdio), поэтому зависимости
  ставились из колёс PyPI напрямую. На обычной машине используйте обычный `pip install`.
- `next dev` запускает дочерний процесс компилятора: в песочнице это `spawn EPERM`,
  запускать нужно вне ограничений.

## Статус

**Работает:** приём заявок с лендинга, валидация белорусских номеров, дедупликация 10 минут,
хранение в SQLite, выдача заявок для бота, лендинг с обязательными блоками и формой.

**Не сделано:**
- бот не проверен вживую — нужен реальный `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`;
  без них он завершается с понятным сообщением (код выхода 2);
- миграции Alembic (сейчас схема создаётся через `create_all`) — этап 3.1 плана;
- автотесты (pytest/vitest/playwright) — этап 5; вместо них два скрипта проверки выше;
- деплой (Vercel + хостинг API), Lighthouse, лог работы с ИИ — этапы 6–7.

