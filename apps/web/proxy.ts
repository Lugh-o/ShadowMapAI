import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Allow public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  
  // Protect all other routes - redirect to login if not authenticated
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
