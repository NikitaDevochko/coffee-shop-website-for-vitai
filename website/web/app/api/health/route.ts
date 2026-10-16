import { NextResponse } from "next/server";

/**
 * Healthcheck фронтенда: используется в чек-листе деплоя.
 * GET /api/health -> { "status": "ok" }
 */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
