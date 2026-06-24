import type { RecentTrends } from "@/features/trends/model";

export type TrendsViewState = "loading" | "error" | "empty" | "ready";

export function getTrendsViewState({
  error,
  loading,
  trends,
}: {
  error: boolean;
  loading: boolean;
  trends: RecentTrends | null;
}): TrendsViewState {
  if (loading) {
    return "loading";
  }

  if (error || !trends) {
    return "error";
  }

  return trends.totalEntries === 0 ? "empty" : "ready";
}
