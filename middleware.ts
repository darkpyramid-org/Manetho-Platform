import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n.config";

export default createMiddleware({
  ...routing,
  localeDetection: true,
});

export const config = {
  // Match all pathnames except API, Next.js internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
