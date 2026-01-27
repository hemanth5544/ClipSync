import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { addCorsHeaders } from "@/lib/cors";

const prisma = new PrismaClient();

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      return addCorsHeaders(response, origin);
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      const response = NextResponse.json({ error: "Invalid token" }, { status: 401 });
      return addCorsHeaders(response, origin);
    }

    const userId = decoded.userId;
    if (!userId) {
      const response = NextResponse.json({ error: "Invalid token" }, { status: 401 });
      return addCorsHeaders(response, origin);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ error: "User not found" }, { status: 404 });
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      id: user.id,
      email: user.email || "",
      name: user.name,
      image: user.image,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error("Get user error:", error);
    const response = NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}
