export const supportedLocales = ["zh-CN", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "zh-CN";

export const localeLabels: Record<AppLocale, string> = {
  "zh-CN": "\u4e2d\u6587",
  en: "English",
};

export function isSupportedLocale(value: string): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}
