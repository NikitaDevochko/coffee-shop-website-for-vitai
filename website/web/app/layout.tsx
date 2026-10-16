import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { site } from "@/lib/content/site";
import "./globals.css";

const title = "Кварта — обжарка кофе в Минске: жарим в четверг, привозим в пятницу";
const description =
  "Мастерская «Кварта» в Минске: обжариваем партиями по 5 кг с 2019 года, зерно у вас на 1–3 день после обжарки. Эфиопия Иргачеффе, Колумбия Уила, Бразилия Серрадо и дрип-пакеты. Подписка — 54 BYN в месяц, доставка по пятницам.";

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: title,
    template: "%s — обжарка «Кварта»",
  },
  description,
  keywords: [
    "обжарка кофе Минск",
    "свежеобжаренный кофе",
    "кофе в зерне Минск",
    "подписка на кофе",
    "Кварта",
  ],
  applicationName: "Кварта",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: site.siteUrl,
    siteName: "Обжарка «Кварта»",
    title: "Кварта — обжарка кофе в Минске",
    description,
    // OG-картинку добавим, когда будет фото из мастерской: public/img/og.jpg
  },
  twitter: {
    card: "summary_large_image",
    title: "Кварта — обжарка кофе в Минске",
    description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1D5C4A",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: "Кварта",
  description,
  url: site.siteUrl,
  foundingDate: String(site.foundedYear),
  priceRange: "18–54 BYN",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressCountry: site.address.country,
  },
  areaServed: site.delivery.area,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  sameAs: [site.social.instagram.url, site.social.telegram.url],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="page">
        {children}
        {/* Без JS анимации появления не нужны: показываем всё сразу. */}
        <noscript>
          <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
        </noscript>
        <script
          type="application/ld+json"
          // Разметка для поисковиков: адрес, часы, цены.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
