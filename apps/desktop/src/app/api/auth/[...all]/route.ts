import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (error: any) {
    console.error("Better-Auth GET error:", error);
    return NextResponse.json(
      { error: "Authentication error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (error: any) {
    console.error("Better-Auth POST error:", error);
    return NextResponse.json(
      { error: "Authentication error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
