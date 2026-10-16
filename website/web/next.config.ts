import type { NextConfig } from "next";

/**
 * Конфиг без Tailwind и без внешних картинок: лендинг целиком на CSS-переменных.
 * Адрес FastAPI берётся из NEXT_PUBLIC_API_BASE_URL (см. .env.example).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
