import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const response = NextResponse.json({
    status: "ok",
    service: "clipsync-auth",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
  return addCorsHeaders(response, origin);
}
