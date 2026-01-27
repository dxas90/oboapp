import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Supported locales
export const locales = ["bg", "en"] as const;
export type Locale = (typeof locales)[number];

// Default locale (Bulgarian)
export const defaultLocale: Locale = "bg";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the URL, or use default
  const locale = (await requestLocale) ?? defaultLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
