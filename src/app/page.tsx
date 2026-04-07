import { AppLayout } from "../components/layout/AppLayout";
import { FeedContainer } from "../components/feed/FeedContainer";
import { StatsPanel } from "../components/panels/StatsPanel";

export const revalidate = 900;

export default function OverviewPage() {
  return (
    <AppLayout rightPanel={<StatsPanel />}>
      <FeedContainer
        mode="overview"
        label="Overview"
        showRank
      />
    </AppLayout>
  );
}
