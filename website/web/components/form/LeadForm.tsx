"use client";

/**
 * Форма заявки.
 *
 * Что важно по брифу и что здесь реализовано:
 *  - три интереса (подписка / разово / вопрос) + необязательный комментарий;
 *  - выбранная в ассортименте позиция едет скрытым полем `position`;
 *  - понятная подсказка при не-белорусском номере;
 *  - повторный клик по кнопке не отправляет вторую заявку (см. useLeadSubmit);
 *  - при 422 подсказки встают под конкретные поля, при 429/5xx — общее сообщение,
 *    а введённые значения остаются на месте.
 */

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";

import { FieldError } from "@/components/form/FieldError";
import { PhoneField } from "@/components/form/PhoneField";
import { useLeadSubmit } from "@/components/form/useLeadSubmit";
import { Button } from "@/components/ui/Button";
import { LEAD_MESSAGES, type LeadFieldErrors, type LeadFieldKey, type LeadIntent } from "@/lib/api";
import { coffeeById, type CoffeeId } from "@/lib/content/coffee";
import { site } from "@/lib/content/site";
import {
  INTENT_EVENT,
  POSITION_EVENT,
  type IntentEventDetail,
  type PositionEventDetail,
} from "@/lib/selection";
import { parsePhone } from "@/lib/validation/phone";

export interface LeadFormProps {
  formId?: string;
  ctaVariant?: string;
  /** Позиция, выбранная до того, как форма появилась на экране. */
  defaultPosition?: CoffeeId | null;
}

interface FormValues {
  name: string;
  phone: string;
  comment: string;
}

const EMPTY_VALUES: FormValues = { name: "", phone: "", comment: "" };

const INTENT_OPTIONS: readonly { value: LeadIntent; title: string; hint: string }[] = [
  {
    value: "subscription",
    title: "Подписка",
    hint: "Две пачки по 50 г раз в месяц — 54 BYN с доставкой",
  },
  {
    value: "one_time",
    title: "Разовый заказ",
    hint: "Пачка зерна или дрип-пакеты: привезём в пятницу",
  },
  {
    value: "question",
    title: "Просто вопрос",
    hint: "Помол, обжарка, доставка — спрашивайте",
  },
];

const PHONE_HINT =
  "Принимаем только номера Беларуси. Можно вставить как удобно: 80 29 123-45-67 или +375 29 123-45-67.";

const NAME_HINT = "Как к вам обращаться. Можно только имя.";

const COMMENT_HINT = "Не обязательно. Например: помол под воронку, привезти в пятницу после 18:00.";

function validate(values: FormValues, intent: LeadIntent | ""): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Как к вам обращаться? Без имени не перезвоним.";
  } else if (name.length > 120) {
    errors.name = "Имя получилось длинным — хватит 120 знаков.";
  }

  const phone = parsePhone(values.phone);
  if (!phone.normalized) {
    errors.phone = phone.errorMessage ?? "Проверьте номер телефона.";
  }

  if (!intent) {
    errors.intent = "Выберите, что вас интересует — так понятнее, что делать дальше.";
  }

  if (values.comment.length > 2000) {
    errors.comment = "Комментарий слишком длинный — сократите до 2000 знаков.";
  }

  return errors;
}

const FIELD_ORDER: readonly LeadFieldKey[] = ["name", "phone", "intent", "comment"];

export function LeadForm({
  formId = "lead-form",
  ctaVariant = "lead-section",
  defaultPosition = null,
}: LeadFormProps) {
  const fieldPrefix = useId();
  const ids = {
    name: `${fieldPrefix}-name`,
    phone: `${fieldPrefix}-phone`,
    comment: `${fieldPrefix}-comment`,
    nameHint: `${fieldPrefix}-name-hint`,
    phoneHint: `${fieldPrefix}-phone-hint`,
    commentHint: `${fieldPrefix}-comment-hint`,
    nameError: `${fieldPrefix}-name-error`,
    phoneError: `${fieldPrefix}-phone-error`,
    commentError: `${fieldPrefix}-comment-error`,
    intentError: `${fieldPrefix}-intent-error`,
    formError: `${fieldPrefix}-form-error`,
  };
  const intentOptionId = (value: LeadIntent) => `${fieldPrefix}-intent-${value}`;

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [intent, setIntent] = useState<LeadIntent | "">("");
  const [position, setPosition] = useState<CoffeeId | null>(defaultPosition);
  const [cta, setCta] = useState(ctaVariant);
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const formErrorRef = useRef<HTMLDivElement | null>(null);

  const { state, isSubmitting, submit, reset } = useLeadSubmit({ formId, ctaVariant: cta });

  // Кнопки в других секциях — обычные ссылки на #lead; здесь мы просто узнаём,
  // что человек выбрал по дороге к форме.
  useEffect(() => {
    const onPositionSelected = (event: Event) => {
      const detail = (event as CustomEvent<PositionEventDetail>).detail;
      if (!detail) return;
      setPosition(detail.position);
      if (detail.ctaVariant) setCta(detail.ctaVariant);
      setIntent((current) => (current ? current : "one_time"));
    };

    const onIntentSelected = (event: Event) => {
      const detail = (event as CustomEvent<IntentEventDetail>).detail;
      if (!detail?.intent) return;
      setIntent(detail.intent);
      if (detail.ctaVariant) setCta(detail.ctaVariant);
      setFieldErrors((current) => ({ ...current, intent: undefined }));
    };

    window.addEventListener(POSITION_EVENT, onPositionSelected);
    window.addEventListener(INTENT_EVENT, onIntentSelected);
    return () => {
      window.removeEventListener(POSITION_EVENT, onPositionSelected);
      window.removeEventListener(INTENT_EVENT, onIntentSelected);
    };
  }, []);

  const chosen = coffeeById(position);

  const focusField = useCallback(
    (key: LeadFieldKey) => {
      if (typeof document === "undefined") return;
      const targetId =
        key === "intent" ? intentOptionId("subscription") : ids[key];
      const node = document.getElementById(targetId);
      if (node instanceof HTMLElement) node.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fieldPrefix],
  );

  const focusFirstError = useCallback(
    (errors: LeadFieldErrors) => {
      const first = FIELD_ORDER.find((key) => errors[key]);
      if (first) focusField(first);
    },
    [focusField],
  );

  const handleNameChange = (value: string) => {
    setValues((current) => ({ ...current, name: value }));
    if (fieldErrors.name) setFieldErrors((current) => ({ ...current, name: undefined }));
  };

  const handlePhoneChange = (value: string) => {
    setValues((current) => ({ ...current, phone: value }));
    if (fieldErrors.phone) setFieldErrors((current) => ({ ...current, phone: undefined }));
  };

  const handlePhoneBlur = () => {
    if (!values.phone.trim()) return;
    const parsed = parsePhone(values.phone);
    setFieldErrors((current) => ({
      ...current,
      phone: parsed.normalized ? undefined : (parsed.errorMessage ?? "Проверьте номер телефона."),
    }));
  };

  const handleCommentChange = (value: string) => {
    setValues((current) => ({ ...current, comment: value }));
    if (fieldErrors.comment) setFieldErrors((current) => ({ ...current, comment: undefined }));
  };

  const handleIntentChange = (value: LeadIntent) => {
    setIntent(value);
    setFieldErrors((current) => ({ ...current, intent: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Страховка на уровне формы: второй клик, пока идёт отправка, ничего не делает.
    if (isSubmitting) return;

    setLocalMessage(null);

    const errors = validate(values, intent);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLocalMessage("Проверьте поля — ниже подсказки.");
      focusFirstError(errors);
      return;
    }

    setFieldErrors({});

    const result = await submit({
      name: values.name,
      phone: values.phone,
      intent: intent as LeadIntent,
      comment: values.comment,
      position,
    });

    // null — отправка уже идёт, повторный клик проигнорирован
    if (!result) return;

    if (result.status === "validation_error") {
      setFieldErrors(result.fields);
      focusFirstError(result.fields);
      return;
    }

    if (result.status === "error") {
      // Сообщение появится на следующем рендере — даём ему шанс отрисоваться.
      window.setTimeout(() => formErrorRef.current?.focus(), 60);
    }
  };

  const handleReset = () => {
    reset();
    setValues(EMPTY_VALUES);
    setIntent("");
    setPosition(defaultPosition);
    setCta(ctaVariant);
    setFieldErrors({});
    setLocalMessage(null);
  };

  if (state.status === "success" || state.status === "duplicate") {
    const isDuplicate = state.status === "duplicate";
    return (
      <div className="lead-success" role="status">
        <p className="lead-success__mark" aria-hidden="true">
          {isDuplicate ? "✓✓" : "✓"}
        </p>
        <h3 className="lead-success__title">
          {isDuplicate ? "Эта заявка уже у нас" : "Готово, заявка у нас"}
        </h3>
        <p className="lead-success__text">{state.message ?? LEAD_MESSAGES.created}</p>
        <p className="lead-success__note">
          Перезвоним в рабочее время: {site.hoursLine}. Если удобнее письменно — напишите в{" "}
          {site.social.telegram.label}: {site.social.telegram.handle}.
        </p>
        <div className="lead-success__actions">
          <Button variant="secondary" onClick={handleReset}>
            Отправить ещё одну заявку
          </Button>
        </div>
      </div>
    );
  }

  const serverMessage =
    state.status === "error" || state.status === "validation_error" ? state.message : null;
  const formMessage = localMessage ?? serverMessage;

  return (
    <form
      className="form"
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting || undefined}
    >
      <input type="hidden" name="position" value={position ?? ""} />

      {formMessage ? (
        <div
          className="form__message form__message--error"
          id={ids.formError}
          role="alert"
          tabIndex={-1}
          ref={formErrorRef}
        >
          {formMessage}
        </div>
      ) : null}

      {chosen ? (
        <p className="form__chosen">
          <span className="form__chosen-label">
            Выбрано: <strong>{chosen.name}</strong>, {chosen.weight} — {chosen.priceByn} BYN
          </span>
          <button
            type="button"
            className="form__chosen-clear"
            onClick={() => setPosition(null)}
          >
            убрать
          </button>
        </p>
      ) : null}

      <div className="form__grid">
        <div className="field">
          <label className="field__label" htmlFor={ids.name}>
            Имя <span className="field__required">*</span>
          </label>
          <input
            id={ids.name}
            name="name"
            className={fieldErrors.name ? "field__input field__input--invalid" : "field__input"}
            type="text"
            autoComplete="name"
            maxLength={120}
            value={values.name}
            onChange={(event) => handleNameChange(event.target.value)}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? `${ids.nameHint} ${ids.nameError}` : ids.nameHint}
            required
          />
          <p className="field__hint" id={ids.nameHint}>
            {NAME_HINT}
          </p>
          <FieldError id={ids.nameError} message={fieldErrors.name} />
        </div>

        <PhoneField
          id={ids.phone}
          value={values.phone}
          error={fieldErrors.phone}
          hint={PHONE_HINT}
          hintId={ids.phoneHint}
          errorId={ids.phoneError}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
        />
      </div>

      <fieldset
        className="fieldset"
        aria-describedby={fieldErrors.intent ? ids.intentError : undefined}
      >
        <legend className="field__label">
          Что интересует <span className="field__required">*</span>
        </legend>
        <div className="intent-options">
          {INTENT_OPTIONS.map((option) => (
            <label
              className={
                intent === option.value ? "intent-option intent-option--checked" : "intent-option"
              }
              key={option.value}
            >
              <input
                className="intent-option__input"
                id={intentOptionId(option.value)}
                type="radio"
                name="intent"
                value={option.value}
                checked={intent === option.value}
                onChange={() => handleIntentChange(option.value)}
              />
              <span className="intent-option__body">
                <span className="intent-option__title">{option.title}</span>
                <span className="intent-option__hint">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id={ids.intentError} message={fieldErrors.intent} />
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor={ids.comment}>
          Комментарий
        </label>
        <textarea
          id={ids.comment}
          name="comment"
          className={
            fieldErrors.comment ? "field__input field__textarea field__input--invalid" : "field__input field__textarea"
          }
          rows={4}
          maxLength={2000}
          value={values.comment}
          onChange={(event) => handleCommentChange(event.target.value)}
          placeholder="Например: нужна доставка в пятницу после 18:00"
          aria-invalid={fieldErrors.comment ? true : undefined}
          aria-describedby={
            fieldErrors.comment ? `${ids.commentHint} ${ids.commentError}` : ids.commentHint
          }
        />
        <p className="field__hint" id={ids.commentHint}>
          {COMMENT_HINT}
        </p>
        <FieldError id={ids.commentError} message={fieldErrors.comment} />
      </div>

      <div className="form__actions">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить заявку"}
        </Button>
        <p className="form__consent">
          Данные используем только для связи по заявке. Никаких рассылок.
        </p>
      </div>
    </form>
  );
}
