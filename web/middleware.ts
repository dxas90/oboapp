import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (_next/static, images, etc.)
  // - Service worker
  matcher: ["/((?!api|_next/static|_next/image|firebase-messaging-sw.js|.*\\..*).*)"],
};
