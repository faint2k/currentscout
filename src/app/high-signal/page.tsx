import { AppLayout } from "../../components/layout/AppLayout";
import { FeedContainer } from "../../components/feed/FeedContainer";
import { HighSignalPanel } from "../../components/panels/HighSignalPanel";
import { loadFeedData } from "../../lib/feed/loadFeedData";

export const revalidate = 900;

export default async function HighSignalPage() {
  const initialFeed = await loadFeedData({ mode: "high-signal", limit: 100 });

  return (
    <AppLayout rightPanel={<HighSignalPanel />}>
      <div className="mb-4 pt-1">
        <h1 className="text-xl font-bold text-zinc-100 leading-snug tracking-tight">High Signal</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Quality-filtered posts combining technical depth with real engagement.
        </p>
      </div>
      <FeedContainer
        mode="high-signal"
        showRank
        initialPosts={initialFeed.posts}
        initialFetchedAt={initialFeed.fetchedAt}
        initialCached={initialFeed.cached}
      />
    </AppLayout>
  );
}
