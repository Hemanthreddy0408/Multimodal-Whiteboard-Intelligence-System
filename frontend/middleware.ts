import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If authenticated and accessing landing or auth pages, redirect to dashboard
    if (token && (path === "/landing" || path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public pages that don't need authentication
        const isPublicPage = 
          path.startsWith("/landing") || 
          path.startsWith("/login") || 
          path.startsWith("/register") || 
          path.startsWith("/pricing") ||
          path.startsWith("/api/register") || 
          path.startsWith("/api/auth") ||
          path.startsWith("/_next") ||
          path.startsWith("/favicon.ico") ||
          path === "/"; // We let '/' be controlled dynamically or redirected to workspace/dashboard

        if (isPublicPage) return true;

        // Otherwise, token must exist to authorize
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
