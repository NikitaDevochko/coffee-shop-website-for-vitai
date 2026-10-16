/**
 * Белорусские телефоны — клиентская копия правил из `website/api/app/utils/phone.py`.
 *
 * Держим логику один в один с сервером: те же формы записи, те же операторские коды,
 * те же тексты подсказок. Если сервер что-то поменяет — менять нужно здесь и там.
 *
 * Принимаем: +375XXXXXXXXX, 375XXXXXXXXX, 80XXXXXXXXX, 0XXXXXXXXX
 * (а также с любыми пробелами, скобками и дефисами).
 * Нормализуем в +375XXXXXXXXX.
 */

export const COUNTRY_CODE = "375";

/** Шаблон для подсказок — с ним сверяются все сообщения об ошибках. */
export const PHONE_TEMPLATE = "+375 (29) 123-45-67";

/** Коды, которые реально работают в Беларуси (как в API). */
export const OPERATOR_CODES = ["17", "21", "22", "23", "25", "29", "33", "44"] as const;

export type OperatorCode = (typeof OPERATOR_CODES)[number];

export type PhoneErrorCode =
  | "phone_required"
  | "not_belarusian"
  | "too_short"
  | "too_long"
  | "unknown_operator";

export const PHONE_ERROR_MESSAGES: Record<PhoneErrorCode, string> = {
  phone_required: "Укажите телефон — мы перезвоним, чтобы подтвердить заказ.",
  not_belarusian:
    "Это не белорусский номер. Принимаем только номера Беларуси: +375 (29) 123-45-67.",
  too_short: "В номере не хватает цифр. Полный формат: +375 (29) 123-45-67.",
  too_long: "В номере слишком много цифр. Полный формат: +375 (29) 123-45-67.",
  unknown_operator: "Такого кода в Беларуси нет. Проверьте номер: +375 (29) 123-45-67.",
};

export interface PhoneParseResult {
  normalized: string | null;
  errorCode: PhoneErrorCode | null;
  errorMessage: string | null;
}

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function fail(code: PhoneErrorCode, operatorCode?: string): PhoneParseResult {
  const errorMessage =
    code === "unknown_operator" && operatorCode
      ? `Код ${operatorCode} не похож на белорусский. Проверьте номер: +375 (29) 123-45-67.`
      : PHONE_ERROR_MESSAGES[code];
  return { normalized: null, errorCode: code, errorMessage };
}

export function parsePhone(raw: string | null | undefined): PhoneParseResult {
  let digits = digitsOnly(raw);

  if (!digits) return fail("phone_required");

  // 00 375..., 8 029... — люди пишут по-разному.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("80")) digits = digits.slice(1);

  if (!digits.startsWith(COUNTRY_CODE)) {
    if (digits.startsWith("0")) {
      digits = COUNTRY_CODE + digits.slice(1);
    } else {
      return fail("not_belarusian");
    }
  }

  const rest = digits.slice(COUNTRY_CODE.length);

  if (rest.length < 7) return fail("too_short");
  if (rest.length > 9) return fail("too_long");

  const operatorCode = rest.slice(0, 2);
  if (!(OPERATOR_CODES as readonly string[]).includes(operatorCode)) {
    return fail("unknown_operator", operatorCode);
  }

  return {
    normalized: `+${COUNTRY_CODE}${rest.padStart(9, "0")}`,
    errorCode: null,
    errorMessage: null,
  };
}

export function normalizePhone(raw: string | null | undefined): string | null {
  return parsePhone(raw).normalized;
}

/** `+375291234567` -> `+375 (29) 123-45-67` (как format_phone на сервере). */
export function formatPhone(value: string | null | undefined): string {
  const digits = digitsOnly(value);
  if (digits.length !== 12 || !digits.startsWith(COUNTRY_CODE)) return value ?? "";
  const rest = digits.slice(COUNTRY_CODE.length);
  return `+${COUNTRY_CODE} (${rest.slice(0, 2)}) ${rest.slice(2, 5)}-${rest.slice(5, 7)}-${rest.slice(7)}`;
}

/**
 * Вытащить из того, что набрал человек, девять «национальных» цифр.
 * Пользователь мог вставить номер целиком, а маска уже подставила +375 — лишние
 * служебные цифры отбрасываем, чтобы не получить номер вида +375 375 29 ...
 */
export function nationalDigits(raw: string | null | undefined): string {
  const digits = digitsOnly(raw);
  if (!digits) return "";

  let rest: string;
  if (digits.startsWith("00")) return nationalDigits(digits.slice(2));
  if (digits.startsWith(COUNTRY_CODE)) rest = digits.slice(COUNTRY_CODE.length);
  else if (digits.startsWith("80")) rest = digits.slice(2);
  else if (digits.startsWith("0")) rest = digits.slice(1);
  else rest = digits;

  // Человек набрал 375 уже после маски (+375 375 29 ...) или начал с 80.
  for (let i = 0; i < 2; i += 1) {
    if (rest.startsWith(COUNTRY_CODE) && rest.length > COUNTRY_CODE.length) {
      rest = rest.slice(COUNTRY_CODE.length);
    } else if (rest.startsWith("80") && rest.length > 2) {
      rest = rest.slice(2);
    } else {
      break;
    }
  }

  return rest.slice(0, 9);
}

/** Маска «на лету»: +375 (29) 123-45-67, достраивается по мере ввода. */
export function formatPhoneInput(raw: string | null | undefined): string {
  const digits = nationalDigits(raw);
  if (!digits) return "";
  if (digits.length <= 2) return `+${COUNTRY_CODE} (${digits}`;
  if (digits.length <= 5) return `+${COUNTRY_CODE} (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) {
    return `+${COUNTRY_CODE} (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return `+${COUNTRY_CODE} (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`;
}

export function isPhoneComplete(raw: string | null | undefined): boolean {
  return parsePhone(raw).normalized !== null;
}

/**
 * Коды из серверного `error.fields.phone` (см. API.md и lead_service.py) в текст
 * для подписи под полем. Совпадает с PHONE_ERROR_MESSAGES, плюс страховка на
 * `required` / `invalid`, которые прилетают от валидатора Pydantic.
 */
export function phoneMessageForServerCode(code: string | null | undefined): string {
  switch (code) {
    case "not_belarusian":
      return PHONE_ERROR_MESSAGES.not_belarusian;
    case "phone_required":
    case "required":
    case "missing":
      return PHONE_ERROR_MESSAGES.phone_required;
    case "too_short":
      return PHONE_ERROR_MESSAGES.too_short;
    case "too_long":
      return PHONE_ERROR_MESSAGES.too_long;
    case "unknown_operator":
      return PHONE_ERROR_MESSAGES.unknown_operator;
    default:
      return "Проверьте номер: нужен белорусский, в формате +375 (29) 123-45-67.";
  }
}
