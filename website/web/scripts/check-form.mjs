/**
 * Проверка реального клиентского кода формы (lib/api.ts, lib/analytics/attribution.ts,
 * lib/validation/phone.ts) против запущенного API.
 *
 * Транспилируем TS в JS средствами установленного typescript, подменяем браузерные
 * глобальные объекты заглушками и вызываем настоящий submitLead.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "../node_modules/typescript/lib/typescript.js";

// Скрипт живёт в website/web/scripts, поэтому корень фронтенда — на уровень выше.
const WEB = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const OUT = new URL("../.tmp-form-check/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.error(
    "Нужен запущенный API и переменная окружения, например:\n" +
      '  $env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"; node scripts/check-form.mjs',
  );
  process.exit(2);
}

const FILES = [
  ["lib/validation/phone.ts", "phone"],
  ["lib/analytics/attribution.ts", "attribution"],
  ["lib/api.ts", "api"],
];

function transpile(rel, name) {
  const source = readFileSync(join(WEB, rel), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: rel,
  }).outputText;
  mkdirSync(dirname(join(OUT, name + ".mjs")), { recursive: true });
  const fixed = js
    .replace(/from\s+"\.\/analytics\/attribution"/g, 'from "./attribution.mjs"')
    .replace(/from\s+"\.\/validation\/phone"/g, 'from "./phone.mjs"')
    .replace(/from\s+"\.\/phone"/g, 'from "./phone.mjs"')
    .replace(/from\s+"@\/([^"]+)"/g, 'from "./$1.mjs"');
  writeFileSync(join(OUT, name + ".mjs"), fixed, "utf8");
}

mkdirSync(OUT, { recursive: true });
for (const [rel, name] of FILES) transpile(rel, name);

// --- заглушки браузерного окружения ---
const search = new URLSearchParams("utm_source=instagram&utm_medium=social&utm_campaign=oct_roast");
globalThis.window = {
  location: {
    href: "https://kvarta.by/?utm_source=instagram&utm_medium=social&utm_campaign=oct_roast",
    search: "?" + search.toString(),
    pathname: "/",
    origin: "https://kvarta.by",
  },
};
globalThis.document = { referrer: "https://l.instagram.com/" };
Object.defineProperty(globalThis, "navigator", {
  value: { userAgent: "form-check" },
  configurable: true,
  writable: true,
});

const { submitLead, LEAD_ENDPOINT_PATH } = await import(
  pathToFileURL(join(OUT, "api.mjs")).href
);
const { collectSource } = await import(pathToFileURL(join(OUT, "attribution.mjs")).href);
const { parsePhone } = await import(pathToFileURL(join(OUT, "phone.mjs")).href);

const source = collectSource({ formId: "lead-hero", ctaVariant: "hero" });
console.log("эндпоинт из кода:", LEAD_ENDPOINT_PATH);
console.log("источник из кода:", JSON.stringify(source));
console.log("");

const results = [];
function check(label, condition, detail) {
  results.push([label, condition, detail]);
  console.log(`${condition ? "OK  " : "FAIL"} ${label}${detail ? " — " + detail : ""}`);
}

// 1. Валидация номера на клиенте
const ru = parsePhone("+7 999 123-45-67");
check("клиент отклоняет российский номер", ru.normalized === null, ru.message ?? "");
const by = parsePhone("80 29 123-45-67");
check("клиент принимает 80-форму", by.normalized === "+375291234567", by.normalized ?? "");
const bad = parsePhone("+375 11 123-45-67");
check("клиент отклоняет чужой код оператора", bad.normalized === null, bad.errorCode ?? "");
console.log("");

function payload(overrides = {}) {
  return {
    name: "Виктория",
    phone: "+37529" + String(1000000 + Math.floor(Math.random() * 8999999)),
    intent: "subscription",
    comment: "проверка связки фронт → API",
    position: "ethiopia-yirgacheffe",
    client_request_id: "formcheck-" + Math.random().toString(36).slice(2),
    source: collectSource({ formId: "lead-hero", ctaVariant: "hero" }),
    ...overrides,
  };
}

// 2. Успешная отправка
const created = await submitLead(payload());
check("201 → status=created", created.status === "created", JSON.stringify(created));

// 3. Двойной клик: тот же client_request_id (номер уникальный, чтобы не сработал дедуп)
const sameId = "double-click-" + Math.random().toString(36).slice(2);
const dblPhone = "+37529" + String(1000000 + Math.floor(Math.random() * 8999999));
const first = await submitLead(payload({ client_request_id: sameId, phone: dblPhone }));
const second = await submitLead(payload({ client_request_id: sameId, phone: dblPhone }));
check(
  "двойной клик не создаёт вторую заявку",
  first.status === "created" && second.status === "duplicate" && first.id === second.id,
  `1-я: ${first.status}/id=${first.id}, 2-я: ${second.status}/id=${second.id}`,
);

// 4. Тот же номер заново, но другой client_request_id (окно дедупликации)
const dupPhone = "+37529" + String(1000000 + Math.floor(Math.random() * 8999999));
const dupFirst = await submitLead(payload({ phone: dupPhone, client_request_id: "dup-a-" + Math.random() }));
// та же цифровая последовательность в форме «80 29 …»
const local = dupPhone.slice("+375".length);
const again = await submitLead(
  payload({ phone: `80${local}`, client_request_id: "dup-b-" + Math.random() }),
);
check(
  "тот же номер в окне 10 минут (другая запись номера) → duplicate",
  dupFirst.status === "created" && again.status === "duplicate" && again.id === dupFirst.id,
  `1-я: ${dupFirst.status}/id=${dupFirst.id}, 2-я: ${again.status}/id=${again.id}`,
);

// 5. Не-белорусский номер через весь путь
const ruLead = await submitLead(payload({ phone: "+7 999 123-45-67" }));
check(
  "не-белорусский номер → validation c понятным текстом",
  ruLead.status === "validation" && /белорусск/i.test(ruLead.message),
  `${ruLead.status}: ${ruLead.message} | fields=${JSON.stringify(ruLead.fields)}`,
);

// 6. Недоступный API (проверяем понятность ошибки)
const down = await submitLead(payload(), {
  fetchImpl: async () => {
    throw new TypeError("fetch failed");
  },
});
check(
  "сеть недоступна → понятное сообщение для человека",
  down.status === "failed" && down.message.includes("попробуйте"),
  `${down.status}: ${down.message}`,
);

const failed = results.filter(([, ok]) => !ok).length;
console.log(`\nитог: ${results.length - failed}/${results.length} проверок пройдено`);
process.exit(failed ? 1 : 0);
