import { EntryDetail } from "@/features/journal/components/entry-detail";

interface EntryDetailPageProps {
  params: Promise<{
    entryId: string;
  }>;
}

export default async function EntryDetailPage({
  params,
}: EntryDetailPageProps) {
  const { entryId } = await params;

  return (
    <main className="page-shell journal-shell">
      <EntryDetail entryId={entryId} />
    </main>
  );
}
