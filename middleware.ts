import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@core/supabase";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Clone the response to modify headers
  const res = response || NextResponse.next();

  // Add CORS headers for RSC requests (identified by _rsc parameter)
  if (request.nextUrl.searchParams.has("_rsc")) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
