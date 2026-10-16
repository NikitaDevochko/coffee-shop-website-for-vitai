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

  /** Хэндлы в соцсетях подтвердить у клиента перед публикацией. */
  social: {
    instagram: {
      label: "Инстаграм",
      handle: "@kvarta.roast",
      url: "https://www.instagram.com/kvarta.roast/",
    },
    telegram: {
      label: "Телеграм",
      handle: "@kvarta_roast",
      url: "https://t.me/kvarta_roast",
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
