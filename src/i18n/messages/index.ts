import type { AppLocale } from "@/i18n/config";
import { en } from "@/i18n/messages/en";
import { zhCN, type Messages } from "@/i18n/messages/zh-CN";

export const messages = {
  "zh-CN": zhCN,
  en,
} as const;

export function getMessages(locale: AppLocale): Messages {
  return messages[locale] as Messages;
}

export type { Messages } from "@/i18n/messages/zh-CN";
