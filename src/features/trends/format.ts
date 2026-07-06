export function formatLocalDate(localDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${localDate}T00:00:00.000Z`));
}

export function formatLocalDateLong(localDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${localDate}T00:00:00.000Z`));
}

export function formatTrendNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
}
