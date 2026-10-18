/**
 * Единый источник фактов о мастерской: секции, JSON-LD, футер.
 *
 * Правило: здесь только то, что есть в брифе клиента. Не добавляйте сюда цены,
 * телефоны и обещания, которых клиент не давал.
 */

export interface OpeningHours {
  readonly days: string;
  readonly time: string;
}

export const site = {
  name: "Кварта",
  nameQuoted: "«Кварта»",
  kind: "обжарка кофе",
  city: "Минск",
  country: "BY",
  foundedYear: 2019,
  batchKg: 5,
  roastDay: "четверг",
  deliveryDay: "пятница",
  freshWindow: "1–3 день после обжарки",
  founders: ["Аня", "Дмитрий"],
  audienceNote: "Пьют дома и в офисе, чаще всего приходят из Instagram и Яндекса",

  address: {
    city: "Минск",
    street: "ул. Короля, 9",
    full: "Минск, ул. Короля, 9",
    country: "Беларусь",
  },

  /**
   * Телефон в шапке. В брифе клиента телефона нет — это значение согласовано
   * с заказчиком в рамках редизайна и должно быть подтверждено перед публикацией.
   */
  phone: {
    raw: "+375291234567",
    label: "+375 (29) 123-45-67",
  },

  hours: [
    { days: "пн–пт", time: "8:00–20:00" },
    { days: "сб–вс", time: "10:00–18:00" },
  ] as readonly OpeningHours[],
  hoursLine: "пн–пт 8:00–20:00, сб–вс 10:00–18:00",
  hoursHuman: "в будни с 8 утра до 8 вечера, в выходные — с 10 до 18",

  delivery: {
    day: "пятница",
    area: "Минск",
    freeFromByn: 50,
    freeFromLabel: "от 50 BYN",
  },

  subscription: {
    priceByn: 54,
    packs: 2,
    packWeight: "50 г",
  },

  /** Контакты в мессенджерах — подтверждены заказчиком при редизайне. */
  social: {
    instagram: {
      label: "Инстаграм",
      handle: "@nikki.tok",
      url: "https://www.instagram.com/nikki.tok/",
    },
    telegram: {
      label: "Телеграм",
      handle: "@n1kk1_tok",
      url: "https://t.me/n1kk1_tok",
    },
  },

  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kvarta.by").replace(/\/+$/, ""),
  defaultSource: process.env.NEXT_PUBLIC_DEFAULT_SOURCE ?? "site",
} as const;

/** Карта: точку ставим по адресу, а не по выдуманным координатам. */
export const mapUrl = `https://yandex.by/maps/?text=${encodeURIComponent(
  "Минск, улица Короля, 9",
)}`;

export const deliveryLine = "Доставка по Минску в пятницу, бесплатно от 50 BYN";

export const roastLine = "Обжариваем по четвергам, развозим по пятницам";
