import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./locales";

// No URL-based i18n routing (no /en, /fr prefixes) — every existing route
// (admin/*, offre/[token], etc.) keeps its exact current path. The active
// locale is just a cookie, defaulting to French.
export default getRequestConfig(async () => {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
