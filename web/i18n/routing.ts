import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // Supported locales
  locales: ["bg", "en"],

  // Default locale (Bulgarian)
  defaultLocale: "bg",

  // Locale prefix strategy: always show locale in URL
  // This makes URLs like /bg/settings and /en/settings
  localePrefix: "always",
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
