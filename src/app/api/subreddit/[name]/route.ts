/**
 * GET /api/subreddit/[name]
 *
 * Returns ranked posts for a single subreddit.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchSubredditFeed } from "../../../../lib/reddit/fetcher";
import { getSubredditConfig } from "../../../../lib/utils/subreddits";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const { posts, cached, fetchedAt } = await fetchSubredditFeed(name);
    const config = getSubredditConfig(name);

    return NextResponse.json({
      posts,
      subreddit: name,
      config,
      fetchedAt,
      cached,
    });
  } catch (err) {
    console.error(`[api/subreddit/${name}] Error:`, err);
    return NextResponse.json({ error: "Failed to fetch subreddit" }, { status: 500 });
  }
}
