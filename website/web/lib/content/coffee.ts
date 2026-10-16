/**
 * Ассортимент «Кварты» — цифры и дескрипторы взяты из брифа клиента дословно.
 * 50 г — это 3–4 чашки в воронке или 5–6 эспрессо; так и объясняем на карточке.
 */

export type CoffeeId =
  | "ethiopia-yirgacheffe"
  | "colombia-huila"
  | "brazil-cerrado"
  | "drip-assorted";

export interface CoffeePosition {
  readonly id: CoffeeId;
  readonly name: string;
  readonly tagline: string;
  /** Дескрипторы вкуса из брифа. */
  readonly notes: readonly string[];
  /** Обжарка, если клиент её назвал; иначе null — не выдумываем. */
  readonly roast: string | null;
  readonly weight: string;
  readonly priceByn: number;
  readonly description: string;
  readonly brew: string;
  readonly badge: string | null;
}

export const coffeePositions: readonly CoffeePosition[] = [
  {
    id: "ethiopia-yirgacheffe",
    name: "Эфиопия Иргачеффе",
    tagline: "Цветы и бергамот",
    notes: ["цветочный", "бергамот"],
    roast: "светлая обжарка",
    weight: "50 г",
    priceByn: 32,
    description:
      "Самый ароматный лот линейки: начинается цветами, заканчивается бергамотом и лёгкой цитрусовой кислотностью. Если любите кофе, который больше похож на чай, — берите эту пачку.",
    brew: "Воронка или аэропресс: 15 г на 250 мл воды.",
    badge: null,
  },
  {
    id: "colombia-huila",
    name: "Колумбия Уила",
    tagline: "Карамель и красное яблоко",
    notes: ["карамель", "красное яблоко"],
    roast: null,
    weight: "50 г",
    priceByn: 29,
    description:
      "Понятный и мягкий кофе: карамельная сладость, яблочная кислинка, ничего лишнего. Тот случай, когда и в воронке хорошо, и в эспрессо не потеряется.",
    brew: "Универсальная позиция: воронка, гейзер, эспрессо.",
    badge: null,
  },
  {
    id: "brazil-cerrado",
    name: "Бразилия Серрадо",
    tagline: "Орех и шоколад",
    notes: ["орех", "шоколад"],
    roast: "под эспрессо",
    weight: "50 г",
    priceByn: 26,
    description:
      "Плотный, без резкой кислотности: орех, тёмный шоколад, на финише немного какао. База для эспрессо и для тех, кто пьёт с молоком.",
    brew: "Эспрессо, гейзер или френч-пресс.",
    badge: null,
  },
  {
    id: "drip-assorted",
    name: "Дрип-пакеты, ассорти",
    tagline: "Десять пакетов в коробке",
    notes: ["в дорогу", "на работу"],
    roast: null,
    weight: "10 штук",
    priceByn: 18,
    description:
      "Те же позиции, только молотые и расфасованные по дрип-пакетам. Залили кипятком, подождали три минуты — кофе готов, никакой техники не нужно. Хорошо в поезд, в офис и в подарок.",
    brew: "Кружка, кипяток, три минуты.",
    badge: "ассорти",
  },
];

export function coffeeById(id: string | null | undefined): CoffeePosition | null {
  if (!id) return null;
  return coffeePositions.find((position) => position.id === id) ?? null;
}

export function priceLabel(position: CoffeePosition): string {
  return `${position.priceByn} BYN`;
}
