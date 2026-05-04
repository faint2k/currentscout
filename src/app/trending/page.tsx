import { AppLayout } from "../../components/layout/AppLayout";
import { FeedContainer } from "../../components/feed/FeedContainer";
import { TrendingPanel } from "../../components/panels/TrendingPanel";
import { loadFeedData } from "../../lib/feed/loadFeedData";

export const revalidate = 900;

export default async function TrendingPage() {
  const initialFeed = await loadFeedData({ mode: "trending", limit: 100 });

  return (
    <AppLayout rightPanel={<TrendingPanel />}>
      <div className="mb-4 pt-1">
        <h1 className="text-xl font-bold text-zinc-100 leading-snug tracking-tight">Trending</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Sorted by velocity — what&apos;s gaining traction fastest right now.
        </p>
      </div>
      <FeedContainer
        mode="trending"
        showRank
        initialPosts={initialFeed.posts}
        initialFetchedAt={initialFeed.fetchedAt}
        initialCached={initialFeed.cached}
      />
    </AppLayout>
  );
}
