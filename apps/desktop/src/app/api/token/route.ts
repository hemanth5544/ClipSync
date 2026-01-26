import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    const session = await auth.api.getSession({
      headers: headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: session.user.id },
      process.env.JWT_SECRET || "change-me-in-production",
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
