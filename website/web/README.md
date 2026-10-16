# kvarta-web — фронтенд лендинга

Next.js 15 (App Router) + React 19 + TypeScript, **без Tailwind**: дизайн-токены
и все стили секций живут в `app/globals.css` (CSS-переменные + обычные классы).
Отдельный подпроект, деплой на Vercel.

- План работ: ../STAGES.md
- Тексты: ../docs/COPY.md
- Контракт API: ../docs/API.md
- Переменные окружения: .env.example

Проверка типов: `pnpm typecheck` (то же самое, что `tsc --noEmit`).

Статус: лендинг собран — секции, форма заявки с идемпотентностью и healthcheck.
OG-картинку добавим, когда появится фото из мастерской (`public/img/`).
