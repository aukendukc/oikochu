import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// App RouterはビルドするときにAPIルートをスキップしますが、
// 静的エクスポート時にエラーを防ぐための空のレスポンスを返します
export async function GET() {
  return NextResponse.json({
    message: "API routes are not supported in static exports",
    status: 404,
  });
}

export async function POST() {
  return NextResponse.json({
    message: "API routes are not supported in static exports",
    status: 404,
  });
} 