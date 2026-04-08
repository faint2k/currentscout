export type SubredditTier = 1 | 2 | 3;

export interface SubredditConfig {
  name:        string;
  tier:        SubredditTier;
  weight:      number;
  category:    string;
  description: string;
  subscribers: number; // approximate, fetched April 2026
}

// Tier weights — multipliers on top of trend score.
// Tiers are assigned by subscriber count percentile (top/mid/bottom third).
// Trend always comes first; weight refines, never overrides.
export const TIER_WEIGHTS: Record<SubredditTier, number> = {
  1: 1.50, // top third  — largest, highest signal density
  2: 1.30, // mid third  — active specialist communities
  3: 1.15, // bot third  — niche / early-stage communities
};

// Sorted by subscriber count descending.
// Tier 1: rank 1–15 | Tier 2: rank 16–30 | Tier 3: rank 31–46
export const SUBREDDITS: SubredditConfig[] = [

  // ── Tier 1 — top third (279K+ subscribers) ───────────────────────────────
  { name: "ChatGPT",              tier: 1, weight: 1.50, subscribers: 11_433_587, category: "Frontier AI",    description: "ChatGPT community" },
  { name: "singularity",          tier: 1, weight: 1.50, subscribers:  3_872_902, category: "Futures",        description: "AGI and AI futures discussion" },
  { name: "MachineLearning",      tier: 1, weight: 1.50, subscribers:  3_036_162, category: "Research",       description: "ML research and papers" },
  { name: "OpenAI",               tier: 1, weight: 1.50, subscribers:  2_701_587, category: "Frontier AI",    description: "OpenAI products and news" },
  { name: "artificial",           tier: 1, weight: 1.50, subscribers:  1_246_780, category: "General AI",     description: "Artificial intelligence news" },
  { name: "StableDiffusion",      tier: 1, weight: 1.50, subscribers:    922_912, category: "Image AI",       description: "Stable Diffusion" },
  { name: "selfhosted",           tier: 1, weight: 1.50, subscribers:    736_983, category: "Infrastructure", description: "Self-hosted AI infrastructure" },
  { name: "ClaudeAI",             tier: 1, weight: 1.50, subscribers:    720_304, category: "Frontier AI",    description: "Claude AI assistant" },
  { name: "LocalLLaMA",           tier: 1, weight: 1.50, subscribers:    679_979, category: "Local AI",       description: "Local LLM running and inference" },
  { name: "learnmachinelearning", tier: 1, weight: 1.50, subscribers:    625_855, category: "Learning",       description: "ML learning community" },
  { name: "ChatGPTPro",           tier: 1, weight: 1.50, subscribers:    571_991, category: "Frontier AI",    description: "ChatGPT Pro users" },
  { name: "ChatGPTCoding",        tier: 1, weight: 1.50, subscribers:    369_283, category: "Dev Tools",      description: "ChatGPT for coding" },
  { name: "PromptEngineering",    tier: 1, weight: 1.50, subscribers:    357_510, category: "Techniques",     description: "Prompt engineering" },
  { name: "AI_Agents",            tier: 1, weight: 1.50, subscribers:    335_779, category: "Agents",         description: "AI agents and agentic systems" },
  { name: "GeminiAI",             tier: 1, weight: 1.50, subscribers:    279_053, category: "Frontier AI",    description: "Google Gemini" },

  // ── Tier 2 — mid third (18K–231K subscribers) ────────────────────────────
  { name: "deeplearning",         tier: 2, weight: 1.30, subscribers:    230_955, category: "Research",       description: "Deep learning techniques" },
  { name: "vibecoding",           tier: 2, weight: 1.30, subscribers:    215_093, category: "Dev Tools",      description: "Vibe coding with AI" },
  { name: "aipromptprogramming",  tier: 2, weight: 1.30, subscribers:    211_928, category: "Techniques",     description: "AI prompt programming" },
  { name: "ClaudeCode",           tier: 2, weight: 1.30, subscribers:    208_016, category: "Dev Tools",      description: "Claude coding assistant" },
  { name: "Perplexity_AI",        tier: 2, weight: 1.30, subscribers:    184_684, category: "Frontier AI",    description: "Perplexity AI" },
  { name: "comfyui",              tier: 2, weight: 1.30, subscribers:    181_178, category: "Image AI",       description: "ComfyUI workflows" },
  { name: "LLMDevs",              tier: 2, weight: 1.30, subscribers:    140_809, category: "Development",    description: "LLM developer community" },
  { name: "LocalLLM",             tier: 2, weight: 1.30, subscribers:    134_382, category: "Local AI",       description: "Local LLM general" },
  { name: "Cursor",               tier: 2, weight: 1.30, subscribers:    131_211, category: "Dev Tools",      description: "Cursor IDE" },
  { name: "ollama",               tier: 2, weight: 1.30, subscribers:    110_063, category: "Local AI",       description: "Ollama runtime community" },
  { name: "LangChain",            tier: 2, weight: 1.30, subscribers:     93_744, category: "Frameworks",     description: "LangChain framework" },
  { name: "RAG",                  tier: 2, weight: 1.30, subscribers:     66_905, category: "Techniques",     description: "Retrieval-augmented generation" },
  { name: "LanguageTechnology",   tier: 2, weight: 1.30, subscribers:     62_825, category: "Research",       description: "NLP and language tech" },
  { name: "Unsloth",              tier: 2, weight: 1.30, subscribers:     20_391, category: "Training",       description: "Unsloth fine-tuning" },
  { name: "OpenWebUI",            tier: 2, weight: 1.30, subscribers:     17_951, category: "Local AI",       description: "Open WebUI frontend" },

  // ── Tier 3 — bottom third (under 10K subscribers) ────────────────────────
  { name: "LargeLanguageModels",  tier: 3, weight: 1.15, subscribers:      9_608, category: "Research",       description: "LLM research and discussion" },
  { name: "AutoGenAI",            tier: 3, weight: 1.15, subscribers:      8_806, category: "Agents",         description: "AutoGen multi-agent" },
  { name: "openrouter",           tier: 3, weight: 1.15, subscribers:      6_796, category: "Infrastructure", description: "OpenRouter API aggregator" },
  { name: "LlamaIndex",           tier: 3, weight: 1.15, subscribers:      4_981, category: "Frameworks",     description: "LlamaIndex framework" },
  { name: "vllm",                 tier: 3, weight: 1.15, subscribers:      2_227, category: "Infrastructure", description: "vLLM inference engine" },
  { name: "OpenInterpreter",      tier: 3, weight: 1.15, subscribers:        132, category: "Agents",         description: "Open Interpreter" },
  { name: "Groq",                 tier: 3, weight: 1.15, subscribers:        102, category: "Hardware",       description: "Groq inference hardware" },
  { name: "aider",                tier: 3, weight: 1.15, subscribers:         60, category: "Dev Tools",      description: "Aider coding assistant" },
  { name: "Agents",               tier: 3, weight: 1.15, subscribers:         35, category: "Agents",         description: "AI agents community" },
  { name: "ContinueDev",          tier: 3, weight: 1.15, subscribers:         25, category: "Dev Tools",      description: "Continue.dev IDE plugin" },
  { name: "ArtificialIntelligence", tier: 3, weight: 1.15, subscribers:       0, category: "General AI",     description: "Broad AI community" },
  { name: "LocalAI",              tier: 3, weight: 1.15, subscribers:          0, category: "Local AI",       description: "LocalAI project" },
  { name: "LMStudio",             tier: 3, weight: 1.15, subscribers:          0, category: "Local AI",       description: "LM Studio app" },
  { name: "GPT4All",              tier: 3, weight: 1.15, subscribers:          0, category: "Local AI",       description: "GPT4All local models" },
];

export const SUBREDDIT_MAP = new Map<string, SubredditConfig>(
  SUBREDDITS.map((s) => [s.name.toLowerCase(), s])
);

export function getSubredditConfig(name: string): SubredditConfig | undefined {
  return SUBREDDIT_MAP.get(name.toLowerCase());
}

export function getSubredditWeight(name: string): number {
  return getSubredditConfig(name)?.weight ?? 1.0;
}

export const SUBREDDIT_NAMES = SUBREDDITS.map((s) => s.name);

export const SUBREDDITS_BY_CATEGORY = SUBREDDITS.reduce<Record<string, SubredditConfig[]>>(
  (acc, sub) => {
    if (!acc[sub.category]) acc[sub.category] = [];
    acc[sub.category].push(sub);
    return acc;
  },
  {}
);

export const CATEGORIES = [
  "Frontier AI",
  "Local AI",
  "Research",
  "Dev Tools",
  "Agents",
  "Frameworks",
  "Techniques",
  "Infrastructure",
  "Image AI",
  "Training",
  "Hardware",
  "Futures",
  "Learning",
  "General AI",
  "Development",
];
