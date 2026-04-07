import { AppLayout } from "../../../components/layout/AppLayout";
import { SubredditFeedContainer } from "../../../components/feed/SubredditFeedContainer";
import { SubredditInfoPanel } from "../../../components/panels/SubredditInfoPanel";
import { SUBREDDIT_NAMES } from "../../../lib/utils/subreddits";

export async function generateStaticParams() {
  return SUBREDDIT_NAMES.map((name) => ({ subreddit: name }));
}

export const revalidate = 900;

interface PageProps {
  params: Promise<{ subreddit: string }>;
}

export default async function SubredditPage({ params }: PageProps) {
  const { subreddit } = await params;

  return (
    <AppLayout rightPanel={<SubredditInfoPanel name={subreddit} />}>
      <SubredditFeedContainer subreddit={subreddit} />
    </AppLayout>
  );
}
