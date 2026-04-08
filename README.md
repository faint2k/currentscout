# CurrentScout

**[currentscout.com](https://currentscout.com)** — Signal from the AI communities on Reddit, ranked by quality.

CurrentScout monitors 46 AI-focused subreddits and surfaces the posts that matter — separating substantive technical discussion from noise. Every post links directly back to the original Reddit thread.

---

## What it does

- Reads public post listings from 46 AI-related subreddits via Reddit's API
- Ranks posts by a quality signal combining community size, feed position, and recency
- Presents a unified feed with sort modes: Best, Trending, New
- Links every post back to Reddit — the goal is to send people *to* Reddit, not replace it

**What it does not do:**
- Post, comment, vote, or take any write actions on Reddit
- Collect, store, or profile individual Reddit user data
- Access private or restricted subreddits
- Resell or sublicense Reddit data

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Cache | Upstash Redis |
| Hosting | Vercel |
| Data refresh | GitHub Actions cron → `/api/cron/refresh` every 15 min |

---

## Ranking algorithm

The scoring system has two modes:

**`rankPosts`** — Full algorithm, used when Reddit OAuth API access is available:
- Momentum (28%): upvote velocity, log-normalised, dampened for posts under 2h old
- Recency (18%): linear decay over 7-day window
- Engagement (38%): score + comment count + upvote ratio
- Quality (16%): title keyword analysis, technical depth signals

**`rankPostsFallback`** — RSS fallback, used while OAuth approval is pending:
- `bestScore`: estimated score from feed position × subreddit size (squared log-ratio), normalised to an absolute scale
- `trendingScore`: feed position + recency — velocity signal only, no sub-weight
- Subreddit weight (1.15×–1.50×) applied based on subscriber count tier

Scores are absolute, not rank-based — a 72 means the same thing regardless of batch size.

---

## Subreddits monitored

46 subreddits across 3 tiers, assigned by subscriber count:

**Tier 1** (top third by subscribers, weight 1.50×):
`ChatGPT` · `singularity` · `MachineLearning` · `OpenAI` · `artificial` · `StableDiffusion` · `ClaudeAI` · `LocalLLaMA` · `learnmachinelearning` · `ChatGPTPro` · `ChatGPTCoding` · `PromptEngineering` · `AI_Agents` · `GeminiAI` · `deeplearning`

**Tier 2** (mid third, weight 1.30×):
`ClaudeCode` · `MistralAI` · `LocalLLM` · `LLMDevs` · `Oobabooga` · `AIAssistants` · `aipromptprogramming` · `AITools` · `PerplexityAI` · `Bard` · `SunoAI` · `ChatGPTJailbreak` · `AIArt` · `midjourney` · `comfyui`

**Tier 3** (bottom third, weight 1.15×):
`ollama` · `openrouter` · `vllm` · `LocalAI` · `mlops` · `reinforcementlearning` · `NLP` · `AIResearch` · `ComputerVision` · `AIethics` · `AIPolicy` · `AgentAI` · `ArtificialSentience` · `selfhosted` · `robotics`

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── posts/route.ts          # GET /api/posts — main feed endpoint
│   │   ├── subreddit/[name]/       # Per-subreddit feed
│   │   └── cron/refresh/           # Cache refresh (called by cron)
│   └── layout.tsx / page.tsx
├── components/
│   ├── feed/                       # FeedContainer, PostCard, filters
│   ├── layout/                     # TopBar, MobileNav, AppLayout
│   └── panels/                     # StatsPanel, Sidebar
└── lib/
    ├── cache/store.ts              # Upstash Redis read/write
    ├── config.ts                   # Site-wide constants
    ├── ranking/
    │   ├── scorer.ts               # rankPosts, rankPostsFallback, badges
    │   └── weights.ts              # All scoring constants in one place
    ├── reddit/
    │   ├── client.ts               # OAuth API client (activates when env vars set)
    │   ├── fetcher.ts              # Orchestrates RSS vs OAuth routing
    │   └── rss.ts                  # RSS fallback parser + estimatedScore
    └── utils/
        └── subreddits.ts           # Subreddit config, tiers, categories
```

---

## Running locally

```bash
npm install
```

Create `.env.local`:
```env
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Optional — activates full OAuth ranking when set
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

```bash
npm run dev
```

The app works without Reddit credentials — it falls back to RSS automatically.

---

## Reddit API usage

This application requests read-only access to public subreddit post listings:

- `GET /r/{subreddit}/hot.json`
- `GET /r/{subreddit}/new.json`

Access pattern: ~46 subreddits polled every 15 minutes from a server-side cron job. All results are cached in Redis. No user data is accessed or stored. OAuth credentials are managed as environment variables — never committed to this repository.

---

## License

MIT
