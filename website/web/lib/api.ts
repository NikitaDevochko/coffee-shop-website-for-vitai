/**
 * Типизированный клиент FastAPI: POST /api/lead (см. website/docs/API.md).
 *
 * Наружу отдаём не «сырой» fetch, а готовый вердикт: создано / дубликат /
 * ошибки полей / слишком часто / не получилось. Форме остаётся только показать текст.
 */

import { collectSource, type LeadSource } from "./analytics/attribution";
import { phoneMessageForServerCode } from "./validation/phone";

export type { LeadSource };

export type LeadIntent = "subscription" | "one_time" | "question";

export const INTENTS: readonly LeadIntent[] = ["subscription", "one_time", "question"];

export const LEAD_ENDPOINT_PATH = "/api/lead";

/** Тело запроса — ровно как в контракте API. */
export interface LeadPayload {
  name: string;
  phone: string;
  intent: LeadIntent;
  comment: string | null;
  position: string | null;
  client_request_id: string;
  source: LeadSource;
}

export type LeadFieldKey = "name" | "phone" | "intent" | "comment";

export type LeadFieldErrors = Partial<Record<LeadFieldKey, string>>;

export type LeadSubmitOutcome =
  | { status: "created"; id: number | null; message: string }
  | { status: "duplicate"; id: number | null; message: string }
  | { status: "validation"; message: string; fields: LeadFieldErrors }
  | { status: "rate_limited"; message: string }
  | { status: "failed"; message: string };

export const LEAD_MESSAGES = {
  created: "Заявка принята. Перезвоним в рабочее время.",
  duplicate: "Заявка уже принята — мы вам перезвоним.",
  validation: "Проверьте заполненные поля.",
  rateLimited:
    "Не получилось отправить: слишком много попыток подряд. Подождите минуту и попробуйте ещё раз — данные в форме остались.",
  failed: "Не получилось отправить, попробуйте ещё раз. Данные в форме остались.",
} as const;

const FIELD_KEYS: readonly LeadFieldKey[] = ["name", "phone", "intent", "comment"];

const SERVER_FIELD_MESSAGES: Record<LeadFieldKey, Record<string, string>> = {
  name: {
    required: "Как к вам обращаться? Заполните имя.",
    missing: "Как к вам обращаться? Заполните имя.",
    invalid: "Имя получилось длинным — хватит 120 знаков.",
  },
  phone: {},
  intent: {
    required: "Выберите, что вас интересует: подписка, разовый заказ или вопрос.",
    invalid: "Выберите, что вас интересует: подписка, разовый заказ или вопрос.",
  },
  comment: {
    invalid: "Комментарий слишком длинный — сократите до 2000 знаков.",
  },
};

const FALLBACK_FIELD_MESSAGES: Record<LeadFieldKey, string> = {
  name: "Проверьте имя.",
  phone: "Проверьте номер телефона.",
  intent: "Выберите, что вас интересует.",
  comment: "Проверьте комментарий.",
};

/** База API без хвостового слэша; если переменной нет — шлём на свой же домен. */
export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

export function leadEndpoint(): string {
  return `${apiBaseUrl()}${LEAD_ENDPOINT_PATH}`;
}

export interface SubmitLeadOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Для тестов: подменённый fetch. */
  fetchImpl?: typeof fetch;
}

export async function submitLead(
  payload: LeadPayload,
  options: SubmitLeadOptions = {},
): Promise<LeadSubmitOutcome> {
  const fetchImpl =
    options.fetchImpl ?? (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  if (!fetchImpl) return { status: "failed", message: LEAD_MESSAGES.failed };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  const external = options.signal;
  const forwardAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", forwardAbort);
  }

  try {
    const response = await fetchImpl(leadEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return await interpretResponse(response);
  } catch {
    // Сеть, таймаут, CORS, 5xx без тела — для человека это одно и то же.
    return { status: "failed", message: LEAD_MESSAGES.failed };
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", forwardAbort);
  }
}

async function interpretResponse(response: Response): Promise<LeadSubmitOutcome> {
  const body = await readJson(response);

  if (response.status === 201) {
    return {
      status: "created",
      id: numberOrNull(pick(body, "id")),
      message: stringOrNull(pick(body, "message_ru")) ?? LEAD_MESSAGES.created,
    };
  }

  if (response.status === 200) {
    const isDuplicate = pick(body, "duplicate") === true;
    return {
      status: isDuplicate ? "duplicate" : "created",
      id: numberOrNull(pick(body, "id")),
      message:
        stringOrNull(pick(body, "message_ru")) ??
        (isDuplicate ? LEAD_MESSAGES.duplicate : LEAD_MESSAGES.created),
    };
  }

  if (response.status === 422) {
    const error = errorOf(body);
    return {
      status: "validation",
      message: error.message ?? LEAD_MESSAGES.validation,
      fields: mapFieldErrors(error.fields),
    };
  }

  if (response.status === 429) {
    const error = errorOf(body);
    return { status: "rate_limited", message: error.message ?? LEAD_MESSAGES.rateLimited };
  }

  const error = errorOf(body);
  return { status: "failed", message: error.message ?? LEAD_MESSAGES.failed };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

interface NormalizedError {
  code: string | null;
  message: string | null;
  fields: Record<string, unknown>;
}

function errorOf(body: unknown): NormalizedError {
  const error = pick(body, "error");
  return {
    code: stringOrNull(pick(error, "code")),
    message: stringOrNull(pick(error, "message_ru")),
    fields: recordOrEmpty(pick(error, "fields")),
  };
}

/** `fields` c сервера могут содержать и вложенные ключи — берём только известные. */
export function mapFieldErrors(fields: Record<string, unknown>): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  for (const [key, rawValue] of Object.entries(fields)) {
    if (!(FIELD_KEYS as readonly string[]).includes(key)) continue;
    const field = key as LeadFieldKey;
    const code = stringOrNull(rawValue);
    if (field === "phone") {
      errors.phone = phoneMessageForServerCode(code);
      continue;
    }
    const table = SERVER_FIELD_MESSAGES[field];
    errors[field] = (code ? table[code] : null) ?? FALLBACK_FIELD_MESSAGES[field];
  }
  return errors;
}

function pick(value: unknown, key: string): unknown {
  if (value && typeof value === "object" && key in value) {
    return (value as Record<string, unknown>)[key];
  }
  return undefined;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function recordOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export { collectSource };
