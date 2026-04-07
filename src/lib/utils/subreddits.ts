export type SubredditTier = 1 | 2 | 3 | 4;

export interface SubredditConfig {
  name: string;
  tier: SubredditTier;
  weight: number;
  category: string;
  description: string;
}

// Tier weights — applied as multipliers on top of trend score
// Trend comes first; subreddit weight refines, never overrides
export const TIER_WEIGHTS: Record<SubredditTier, number> = {
  1: 1.50, // Core AI builder/researcher communities
  2: 1.30, // Major AI consumer/discussion communities
  3: 1.15, // Specialised tools, frameworks, and model-specific subs
  4: 1.00, // General AI / broader scope
};

export const SUBREDDITS: SubredditConfig[] = [
  // ── Tier 1: Core builder / researcher signal ──────────────────────────────
  { name: "LocalLLaMA",          tier: 1, weight: 1.50, category: "Local AI",       description: "Local LLM running and inference" },
  { name: "ClaudeCode",          tier: 1, weight: 1.50, category: "Dev Tools",      description: "Claude coding assistant" },
  { name: "ollama",              tier: 1, weight: 1.50, category: "Local AI",       description: "Ollama runtime community" },
  { name: "OpenWebUI",           tier: 1, weight: 1.50, category: "Local AI",       description: "Open WebUI frontend" },
  { name: "MachineLearning",     tier: 1, weight: 1.50, category: "Research",       description: "ML research and papers" },
  { name: "singularity",         tier: 1, weight: 1.50, category: "Futures",        description: "AGI and AI futures discussion" },
  { name: "selfhosted",          tier: 1, weight: 1.45, category: "Infrastructure", description: "Self-hosted AI infrastructure" },

  // ── Tier 2: Major AI communities ─────────────────────────────────────────
  { name: "OpenAI",              tier: 2, weight: 1.30, category: "Frontier AI",    description: "OpenAI products and news" },
  { name: "ClaudeAI",            tier: 2, weight: 1.30, category: "Frontier AI",    description: "Claude AI assistant" },
  { name: "ChatGPT",             tier: 2, weight: 1.30, category: "Frontier AI",    description: "ChatGPT community" },
  { name: "LLMDevs",             tier: 2, weight: 1.30, category: "Development",    description: "LLM developer community" },
  { name: "AI_Agents",           tier: 2, weight: 1.30, category: "Agents",         description: "AI agents and agentic systems" },
  { name: "LargeLanguageModels", tier: 2, weight: 1.25, category: "Research",       description: "LLM research and discussion" },
  { name: "artificial",          tier: 2, weight: 1.25, category: "General AI",     description: "Artificial intelligence news" },
  { name: "ArtificialIntelligence", tier: 2, weight: 1.25, category: "General AI",  description: "Broad AI community" },

  // ── Tier 3: Specialised frameworks, tools, models ─────────────────────────
  { name: "ChatGPTCoding",       tier: 3, weight: 1.15, category: "Dev Tools",      description: "ChatGPT for coding" },
  { name: "ChatGPTPro",          tier: 3, weight: 1.15, category: "Frontier AI",    description: "ChatGPT Pro users" },
  { name: "deeplearning",        tier: 3, weight: 1.15, category: "Research",       description: "Deep learning techniques" },
  { name: "learnmachinelearning",tier: 3, weight: 1.15, category: "Learning",       description: "ML learning community" },
  { name: "LanguageTechnology",  tier: 3, weight: 1.15, category: "Research",       description: "NLP and language tech" },
  { name: "LocalLLM",            tier: 3, weight: 1.15, category: "Local AI",       description: "Local LLM general" },
  { name: "PromptEngineering",   tier: 3, weight: 1.15, category: "Techniques",     description: "Prompt engineering" },
  { name: "aipromptprogramming", tier: 3, weight: 1.15, category: "Techniques",     description: "AI prompt programming" },
  { name: "comfyui",             tier: 3, weight: 1.15, category: "Image AI",       description: "ComfyUI workflows" },
  { name: "StableDiffusion",     tier: 3, weight: 1.15, category: "Image AI",       description: "Stable Diffusion" },
  { name: "LocalAI",             tier: 3, weight: 1.15, category: "Local AI",       description: "LocalAI project" },
  { name: "vllm",                tier: 3, weight: 1.15, category: "Infrastructure", description: "vLLM inference engine" },
  { name: "llama_cpp",           tier: 3, weight: 1.15, category: "Local AI",       description: "llama.cpp project" },
  { name: "Groq",                tier: 3, weight: 1.15, category: "Hardware",       description: "Groq inference hardware" },
  { name: "Perplexity_AI",       tier: 3, weight: 1.15, category: "Frontier AI",    description: "Perplexity AI" },
  { name: "GeminiAI",            tier: 3, weight: 1.15, category: "Frontier AI",    description: "Google Gemini" },
  { name: "Cursor",              tier: 3, weight: 1.15, category: "Dev Tools",      description: "Cursor IDE" },
  { name: "cursor_ai",           tier: 3, weight: 1.15, category: "Dev Tools",      description: "Cursor AI coding" },
  { name: "aider",               tier: 3, weight: 1.15, category: "Dev Tools",      description: "Aider coding assistant" },
  { name: "openrouter",          tier: 3, weight: 1.15, category: "Infrastructure", description: "OpenRouter API aggregator" },
  { name: "LMStudio",            tier: 3, weight: 1.15, category: "Local AI",       description: "LM Studio app" },
  { name: "GPT4All",             tier: 3, weight: 1.10, category: "Local AI",       description: "GPT4All local models" },
  { name: "Unsloth",             tier: 3, weight: 1.15, category: "Training",       description: "Unsloth fine-tuning" },
  { name: "LangChain",           tier: 3, weight: 1.15, category: "Frameworks",     description: "LangChain framework" },
  { name: "LlamaIndex",          tier: 3, weight: 1.15, category: "Frameworks",     description: "LlamaIndex framework" },
  { name: "RAG",                 tier: 3, weight: 1.15, category: "Techniques",     description: "Retrieval-augmented generation" },
  { name: "Agents",              tier: 3, weight: 1.15, category: "Agents",         description: "AI agents community" },
  { name: "AutoGenAI",           tier: 3, weight: 1.15, category: "Agents",         description: "AutoGen multi-agent" },
  { name: "OpenInterpreter",     tier: 3, weight: 1.15, category: "Agents",         description: "Open Interpreter" },
  { name: "ContinueDev",         tier: 3, weight: 1.15, category: "Dev Tools",      description: "Continue.dev IDE plugin" },
  { name: "vibecoding",          tier: 3, weight: 1.15, category: "Dev Tools",      description: "Vibe coding with AI" },
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
  "Local AI",
  "Frontier AI",
  "Research",
  "Development",
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
];
