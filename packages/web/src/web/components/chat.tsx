import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  Copy,
  Check,
  RotateCcw,
  Wrench,
  ChevronDown,
  ArrowUpRight,
  PenLine,
  Code2,
  Lightbulb,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { textOf, type Conversation } from "../lib/history";

export function AstraMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 1.5c1.3 8.7 5.8 13.2 14.5 14.5C21.8 17.3 17.3 21.8 16 30.5 14.7 21.8 10.2 17.3 1.5 16 10.2 14.7 14.7 10.2 16 1.5Z" />
    </svg>
  );
}

type Props = {
  conversation: Conversation;
  history: Conversation[];
  model: string;
  modelName: string;
  enabledTools: string[];
  onMessages: (id: string, messages: UIMessage[]) => void;
  onBusy: (busy: boolean) => void;
  openTools: () => void;
  ready: boolean;
};
const suggestions = [
  {
    icon: PenLine,
    title: "把想法写出来",
    subtitle: "从一封邮件，到一个好故事",
    prompt: "帮我写一封简洁、得体的工作邮件，先问我你需要了解的信息。",
  },
  {
    icon: Code2,
    title: "一起解决问题",
    subtitle: "代码、数据，或卡住的难题",
    prompt: "调用计算器，帮我算出 128 × 36 + 2048，并告诉我结果。",
  },
  {
    icon: Lightbulb,
    title: "探索新的可能",
    subtitle: "让一个小想法，走得更远",
    prompt: "我想开始一个个人项目。请先问我三个问题，帮我找到值得投入的方向。",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-button"
      title={copied ? "已复制" : "复制回复"}
      aria-label="复制回复"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

function ToolResult({ part }: { part: UIMessage["parts"][number] }) {
  if (!part.type.startsWith("tool-") && part.type !== "dynamic-tool") return null;
  const p = part as unknown as {
    type: string;
    toolName?: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
  const labels: Record<string, string> = {
    calculator: "计算器",
    currentTime: "当前时间",
    convertUnit: "单位换算",
    dateMath: "日期计算",
    textStats: "文本分析",
    formatJson: "JSON 格式化",
    randomNumber: "随机数",
    searchHistory: "会话检索",
  };
  const name = p.toolName ?? p.type.slice(5);
  const done = p.state === "output-available";
  const failed = p.state === "output-error";
  return (
    <details className={`tool-result ${failed ? "failed" : ""}`}>
      <summary>
        {done ? (
          <Check size={14} />
        ) : failed ? (
          <Wrench size={14} />
        ) : (
          <Loader2 size={14} className="spin" />
        )}
        <span>{labels[name] ?? name}</span>
        <span className="tool-result-status">
          {done ? "调用完成" : failed ? "调用失败" : "正在调用"}
        </span>
        <ChevronDown size={13} />
      </summary>
      <div className="tool-result-body">
        <div className="result-label">输入</div>
        <pre>{JSON.stringify(p.input, null, 2)}</pre>
        {(done || failed) && (
          <>
            <div className="result-label">{failed ? "错误" : "结果"}</div>
            <pre>{failed ? p.errorText : JSON.stringify(p.output, null, 2)}</pre>
          </>
        )}
      </div>
    </details>
  );
}

export function Chat({
  conversation,
  history,
  model,
  modelName,
  enabledTools,
  onMessages,
  onBusy,
  openTools,
  ready,
}: Props) {
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const latest = useRef({ history, model, enabledTools });
  latest.current = { history, model, enabledTools };
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent/messages",
        body: () => ({
          model: latest.current.model,
          enabledTools: latest.current.enabledTools,
          history: latest.current.history
            .filter((h) => h.messages.length)
            .slice(0, 50)
            .map((h) => ({
              id: h.id,
              title: h.title.slice(0, 200),
              text: h.messages.map(textOf).join("\n").slice(0, 12000),
            })),
        }),
      }),
    [],
  );
  const { messages, sendMessage, status, stop, error, regenerate, clearError } = useChat({
    id: conversation.id,
    messages: conversation.messages,
    transport,
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);
  useEffect(() => {
    if (messages !== conversation.messages) onMessages(conversation.id, messages);
  }, [messages, onMessages, conversation.id, conversation.messages]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: busy ? "instant" : "smooth" });
  }, [messages, busy]);
  useEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = "auto";
      textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 180)}px`;
    }
  }, [input]);
  const send = (text = input) => {
    if (!text.trim() || busy || !ready) return;
    clearError();
    setInput("");
    void sendMessage({ text: text.trim() });
  };
  const empty = messages.length === 0;

  const composer = (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="有什么想法，尽管告诉 Astra…"
          aria-label="发送消息给 Astra"
          rows={2}
          maxLength={20000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-bottom">
          <button className="tool-toggle" onClick={openTools}>
            <Wrench size={15} />
            <span>工具</span>
            <span className="mini-count">{enabledTools.length}</span>
          </button>
          <span className="composer-model">{modelName}</span>
          {busy ? (
            <button
              className="send-button"
              onClick={() => void stop()}
              aria-label="停止生成"
              title="停止生成"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              className="send-button"
              disabled={!input.trim() || !ready}
              onClick={() => send()}
              aria-label="发送消息"
              title="发送消息"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="composer-caption">
        <span>Astra 可能会出错，重要信息请核实。</span>
        <span className="keyboard-hint">Enter 发送 · Shift + Enter 换行</span>
      </div>
    </div>
  );

  return (
    <div className={`chat-area ${empty ? "is-empty" : ""}`}>
      {empty ? (
        <div className="welcome">
          <div className="welcome-intro">
            <AstraMark className="welcome-star" />
            <div className="eyebrow">一点灵感，无限可能</div>
            <h1>
              你好，我是 Astra<span>。</span>
            </h1>
            <p>想清楚，做出来。我们从你的一个想法开始。</p>
          </div>
          {composer}
          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s.title}
                className="suggestion"
                disabled={busy || !ready}
                onClick={() => send(s.prompt)}
              >
                <div className="suggestion-top">
                  <s.icon size={18} />
                  <ArrowUpRight size={15} />
                </div>
                <strong>{s.title}</strong>
                <span>{s.subtitle}</span>
              </button>
            ))}
          </div>
          <div className="capability-note">
            <span className="status-dot" />
            支持多步工具调用<span className="divider-dot">·</span>会话自动保存在此浏览器
          </div>
        </div>
      ) : (
        <>
          <div className="messages-scroll">
            <div className="messages">
              {messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  {message.role === "assistant" && (
                    <div className="assistant-label">
                      <AstraMark /> <strong>Astra</strong>
                    </div>
                  )}
                  <div className="message-content">
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <div key={index} className="markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <ToolResult key={index} part={part} />
                      ),
                    )}
                  </div>
                  {message.role === "assistant" && textOf(message) && !busy && (
                    <div className="message-actions">
                      <CopyButton text={textOf(message)} />
                      {message.id === messages.at(-1)?.id && (
                        <button
                          className="icon-button"
                          aria-label="重新生成"
                          title="重新生成"
                          onClick={() => void regenerate()}
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
              {status === "submitted" && (
                <div className="thinking">
                  <AstraMark />
                  <span>Astra 正在思考</span>
                  <i />
                  <i />
                  <i />
                </div>
              )}
              {error && (
                <div className="error-banner">
                  AI 暂时未能完成回复。请重试，或切换模型。
                  <button
                    onClick={() => {
                      clearError();
                      void regenerate();
                    }}
                  >
                    重试
                  </button>
                </div>
              )}
              <div ref={bottom} />
            </div>
          </div>
          <div className="bottom-composer">{composer}</div>
        </>
      )}
    </div>
  );
}
