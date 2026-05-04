import { AppLayout } from "../components/layout/AppLayout";
import { FeedContainer } from "../components/feed/FeedContainer";
import { StatsPanel } from "../components/panels/StatsPanel";
import { loadFeedData } from "../lib/feed/loadFeedData";

export const revalidate = 900;

export default async function OverviewPage() {
  const initialFeed = await loadFeedData({ mode: "overview", limit: 100 });

  return (
    <AppLayout rightPanel={<StatsPanel />}>
      <FeedContainer
        mode="overview"
        label="Overview"
        showRank
        showHero
        initialPosts={initialFeed.posts}
        initialFetchedAt={initialFeed.fetchedAt}
        initialCached={initialFeed.cached}
      />
    </AppLayout>
  );
}
