export function formatLocalDate(localDate: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${localDate}T00:00:00.000Z`));
}

export function formatLocalDateLong(localDate: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${localDate}T00:00:00.000Z`));
}

export function formatTrendNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }).format(value);
}
