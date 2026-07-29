import type { AppLocale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import type { AiFeedbackProviderInput } from "@/server/ai/provider";
import type { JournalEntryRecord } from "@/server/repositories/journal-repository";

export const MAX_PROVIDER_NOTE_CHARACTERS = 1200;

function sanitizeUntrustedText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
}

export function truncateUnicode(value: string, maximum: number): string {
  return Array.from(value).slice(0, maximum).join("");
}

export function buildAiFeedbackProviderInput(
  entry: JournalEntryRecord,
  locale: AppLocale = defaultLocale,
): AiFeedbackProviderInput {
  return buildAiFeedbackProviderInputFromFields(
    {
      mood: entry.mood,
      stress: entry.stress,
      energy: entry.energy,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality,
      eventTags: entry.eventTags,
      note: entry.note,
    },
    locale,
  );
}

export function buildAiFeedbackProviderInputFromFields(
  entry: AiFeedbackProviderInput["journal"],
  locale: AppLocale = defaultLocale,
): AiFeedbackProviderInput {
  return {
    system: {
      contractVersion: "1",
      userContentIsUntrusted: true,
    },
    journal: {
      mood: entry.mood,
      stress: entry.stress,
      energy: entry.energy,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality,
      eventTags: [...entry.eventTags],
      note: truncateUnicode(
        sanitizeUntrustedText(entry.note),
        MAX_PROVIDER_NOTE_CHARACTERS,
      ),
    },
    locale,
  };
}
