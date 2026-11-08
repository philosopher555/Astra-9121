import { base } from "../__core/app";
import { catalog } from "../agent/tools";
export const agent = {
  config: base.handler(() => ({
    configured: Boolean(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY),
    tools: catalog,
    models: [
      { id: "openai/gpt-5.4-mini", name: "GPT-5.4 Mini", detail: "快速、灵活，适合日常对话" },
      { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", detail: "适合深入分析与写作" },
    ],
  })),
};
