import { NextResponse } from "next/server";


function getAllowedOrigins(): string[] {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "";
  
  if (!allowedOriginsEnv) {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
    ];
  }

  return allowedOriginsEnv
    .split(",")
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (origin) {
  
    if (allowedOrigins.length > 0) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
    }
  } else {
    if (allowedOrigins.length > 0) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
    }
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}
