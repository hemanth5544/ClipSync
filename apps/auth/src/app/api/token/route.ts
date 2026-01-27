import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    const session = await auth.api.getSession({
      headers: headers,
    });

    if (!session?.user?.id) {
      const response = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      return addCorsHeaders(response, origin);
    }

    const token = jwt.sign(
      { userId: session.user.id },
      process.env.JWT_SECRET || "change-me-in-production",
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({ token });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error("Token generation error:", error);
    const response = NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}
