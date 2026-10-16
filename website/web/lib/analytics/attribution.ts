/**
 * Источник заявки: откуда человек пришёл и по какой кнопке нажал.
 * Бриф: менеджеру важно знать, Instagram это, Яндекс или объявление.
 *
 * Ничего не храним и не достраиваем: только текущий адрес, referrer и utm_*.
 */

export interface LeadSource {
  page_url: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  form_id: string;
  cta_variant: string;
}

export interface CollectSourceOptions {
  /** id формы: удобно, когда на странице больше одной формы. */
  formId?: string;
  /** Вариант CTA, по которому пришли: hero, assortment, subscription, lead-section. */
  ctaVariant?: string;
  /** Подменяемые значения — для тестов и для серверного рендера. */
  href?: string;
  referrer?: string;
  search?: string;
}

const MAX_PAGE_URL = 2000;
const MAX_REFERRER = 2000;
const MAX_UTM = 120;
const MAX_SOURCE_ID = 60;

const DEFAULT_FORM_ID = `${process.env.NEXT_PUBLIC_DEFAULT_SOURCE ?? "site"}-lead`;
const DEFAULT_CTA_VARIANT = "lead-section";

function trimTo(value: string | null | undefined, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function readUtm(search: string, key: string): string | null {
  if (!search) return null;
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    return trimTo(params.get(key), MAX_UTM);
  } catch {
    return null;
  }
}

export function collectSource(options: CollectSourceOptions = {}): LeadSource {
  const hasWindow = typeof window !== "undefined";

  const href =
    options.href ?? (hasWindow ? window.location.href : "");
  const search =
    options.search ?? (hasWindow ? window.location.search : "");
  const referrerRaw =
    options.referrer ?? (hasWindow ? document.referrer : "");

  return {
    page_url: trimTo(href, MAX_PAGE_URL) ?? "",
    referrer: trimTo(referrerRaw, MAX_REFERRER),
    utm_source: readUtm(search, "utm_source"),
    utm_medium: readUtm(search, "utm_medium"),
    utm_campaign: readUtm(search, "utm_campaign"),
    form_id: trimTo(options.formId, MAX_SOURCE_ID) ?? DEFAULT_FORM_ID,
    cta_variant: trimTo(options.ctaVariant, MAX_SOURCE_ID) ?? DEFAULT_CTA_VARIANT,
  };
}
