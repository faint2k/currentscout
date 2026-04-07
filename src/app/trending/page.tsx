import { AppLayout } from "../../components/layout/AppLayout";
import { FeedContainer } from "../../components/feed/FeedContainer";
import { TrendingPanel } from "../../components/panels/TrendingPanel";

export const revalidate = 900;

export default function TrendingPage() {
  return (
    <AppLayout rightPanel={<TrendingPanel />}>
      <FeedContainer
        mode="trending"
        label="Trending"
        showRank
      />
    </AppLayout>
  );
}
