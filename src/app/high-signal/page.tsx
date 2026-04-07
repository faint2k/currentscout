import { AppLayout } from "../../components/layout/AppLayout";
import { FeedContainer } from "../../components/feed/FeedContainer";
import { HighSignalPanel } from "../../components/panels/HighSignalPanel";

export const revalidate = 900;

export default function HighSignalPage() {
  return (
    <AppLayout rightPanel={<HighSignalPanel />}>
      <FeedContainer
        mode="high-signal"
        label="High Signal"
        showRank
      />
    </AppLayout>
  );
}
