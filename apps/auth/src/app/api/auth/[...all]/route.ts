import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";

const handler = toNextJsHandler(auth);

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const response = await handler.GET(req);
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error("Better-Auth GET error:", error);
    const response = NextResponse.json(
      { error: "Authentication error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
    return addCorsHeaders(response, req.headers.get("origin"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const response = await handler.POST(req);
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error("Better-Auth POST error:", error);
    const response = NextResponse.json(
      { error: "Authentication error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
    return addCorsHeaders(response, req.headers.get("origin"));
  }
}
