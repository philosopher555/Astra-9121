import type { UIMessage } from "ai";
export type Conversation = {
  id: string;
  title: string;
  messages: UIMessage[];
  updatedAt: number;
  createdAt: number;
};
export const STORAGE_KEY = "astra.conversations.v1";
export const newConversation = (): Conversation => ({
  id: crypto.randomUUID(),
  title: "新会话",
  messages: [],
  updatedAt: Date.now(),
  createdAt: Date.now(),
});
export function loadHistory(): Conversation[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(data)
      ? data.filter(
          (c) =>
            typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages),
        )
      : [];
  } catch {
    return [];
  }
}
export function textOf(message: UIMessage) {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}
export function exportChat(conversation: Conversation) {
  const text =
    `# ${conversation.title}\n\n` +
    conversation.messages
      .map((m) => `## ${m.role === "user" ? "你" : "Astra"}\n\n${textOf(m)}`)
      .join("\n\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${conversation.title.replace(/[\\/:*?"<>|]/g, "-")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
