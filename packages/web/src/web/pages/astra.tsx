import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Wrench,
  MessageSquare,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  X,
  Check,
  Loader2,
  Info,
} from "lucide-react";
import type { UIMessage } from "ai";
import { Chat, AstraMark } from "../components/chat";
import { ToolPanel } from "../components/tool-panel";
import { Modal } from "../components/modal";
import {
  loadHistory,
  newConversation,
  STORAGE_KEY,
  textOf,
  exportChat,
  type Conversation,
} from "../lib/history";
import { useAgentConfig } from "../queries/agent";

const allTools = [
  "calculator",
  "convertUnit",
  "formatJson",
  "randomNumber",
  "currentTime",
  "dateMath",
  "textStats",
  "searchHistory",
];
export default function AstraPage() {
  const config = useAgentConfig();
  const [history, setHistory] = useState<Conversation[]>(loadHistory);
  const [draft, setDraft] = useState<Conversation>(newConversation);
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("astra.active");
    } catch {
      return null;
    }
  });
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebar, setSidebar] = useState(() => window.innerWidth > 760);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("openai/gpt-5.4-mini");
  const [enabledTools, setEnabledTools] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("astra.tools") ?? "null");
      return Array.isArray(saved) ? saved.filter((x) => allTools.includes(x)) : allTools;
    } catch {
      return allTools;
    }
  });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const active = history.find((h) => h.id === activeId) ?? draft;
  const modelName = config.data?.models.find((m) => m.id === model)?.name ?? "GPT-5.4 Mini";
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      localStorage.setItem("astra.active", activeId ?? "");
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [history, activeId]);
  useEffect(() => {
    try {
      localStorage.setItem("astra.tools", JSON.stringify(enabledTools));
    } catch {
      /* settings are optional */
    }
  }, [enabledTools]);
  const onMessages = useCallback((id: string, messages: UIMessage[]) => {
    if (!messages.length) return;
    setHistory((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing?.messages === messages) return prev;
      const first = messages.find((m) => m.role === "user");
      const title = existing?.title ?? (first ? textOf(first).slice(0, 24) : "新会话");
      const next = {
        id,
        title,
        messages,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      return [next, ...prev.filter((c) => c.id !== id)];
    });
    setActiveId(id);
  }, []);
  const newChat = () => {
    if (busy) return;
    setDraft(newConversation());
    setActiveId(null);
    setMenuId(null);
    if (window.innerWidth <= 760) setSidebar(false);
  };
  const selectChat = (id: string) => {
    if (busy) return;
    setActiveId(id);
    setMenuId(null);
    if (window.innerWidth <= 760) setSidebar(false);
  };
  const filtered = useMemo(
    () =>
      history.filter((c) =>
        `${c.title} ${c.messages.map(textOf).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [history, search],
  );
  const groups = [
    {
      label: "今天",
      items: filtered.filter(
        (c) => new Date(c.updatedAt).toDateString() === new Date().toDateString(),
      ),
    },
    {
      label: "更早",
      items: filtered.filter(
        (c) => new Date(c.updatedAt).toDateString() !== new Date().toDateString(),
      ),
    },
  ];
  const closeTools = useCallback(() => setToolsOpen(false), []);
  const commitRename = () => {
    if (renameText.trim())
      setHistory((prev) =>
        prev.map((c) => (c.id === renameId ? { ...c, title: renameText.trim().slice(0, 100) } : c)),
      );
    setRenameId(null);
  };
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModelsOpen(false);
        setMenuId(null);
        setAboutOpen(false);
        setDeleteId(null);
        setRenameId(null);
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);

  return (
    <div className={`astra-app ${sidebar ? "" : "sidebar-hidden"}`}>
      {sidebar && (
        <button
          aria-label="关闭侧栏遮罩"
          className="sidebar-scrim"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className="sidebar">
        <div className="brand-row">
          <button className="brand" onClick={newChat} disabled={busy} aria-label="Astra 首页">
            <AstraMark />
            <span>Astra</span>
          </button>
          <button
            className="icon-button sidebar-collapse"
            aria-label="收起侧栏"
            onClick={() => setSidebar(false)}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        <button className="new-chat" disabled={busy} onClick={newChat}>
          <Plus size={18} />
          <span>新建会话</span>
          <span className="new-shortcut">＋</span>
        </button>
        <button
          className={`search-trigger ${searchOpen ? "active" : ""}`}
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search size={17} />
          <span>搜索会话</span>
        </button>
        {searchOpen && (
          <div className="history-search">
            <input
              placeholder="搜索标题或对话内容"
              aria-label="搜索会话记录"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="清空搜索">
                <X size={13} />
              </button>
            )}
          </div>
        )}
        <div className="history-area">
          <div className="section-label">
            会话记录<span>{history.length > 0 ? history.length : ""}</span>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">
              <MessageSquare size={22} strokeWidth={1.3} />
              <p>每个想法，都值得留下</p>
              <span>开始对话后，记录会出现在这里</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="history-empty">
              <Search size={20} />
              <p>没有找到相关会话</p>
              <span>试试其他关键词</span>
            </div>
          ) : (
            groups.map(
              (g) =>
                g.items.length > 0 && (
                  <div className="history-group" key={g.label}>
                    <h3>{g.label}</h3>
                    {g.items.map((c) => (
                      <div
                        className={`history-item ${active.id === c.id ? "selected" : ""}`}
                        key={c.id}
                      >
                        <button
                          className="history-select"
                          disabled={busy}
                          title={c.title}
                          onClick={() => selectChat(c.id)}
                        >
                          <MessageSquare size={15} />
                          <span>{c.title}</span>
                        </button>
                        <button
                          className="history-more"
                          aria-label={`管理会话：${c.title}`}
                          disabled={busy}
                          onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {menuId === c.id && (
                          <>
                            <button
                              aria-label="关闭会话菜单"
                              className="menu-scrim"
                              onClick={() => setMenuId(null)}
                            />
                            <div className="history-menu">
                              <button
                                onClick={() => {
                                  setRenameId(c.id);
                                  setRenameText(c.title);
                                  setMenuId(null);
                                }}
                              >
                                <Pencil size={14} />
                                重命名
                              </button>
                              <button
                                onClick={() => {
                                  exportChat(c);
                                  setMenuId(null);
                                }}
                              >
                                <Download size={14} />
                                导出 Markdown
                              </button>
                              <button
                                className="danger"
                                onClick={() => {
                                  setDeleteId(c.id);
                                  setMenuId(null);
                                }}
                              >
                                <Trash2 size={14} />
                                删除会话
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ),
            )
          )}
        </div>
        <div className="sidebar-footer">
          <button className="tool-nav" onClick={() => setToolsOpen(true)}>
            <Wrench size={17} />
            <span>工具箱</span>
            <span className="count-badge">{enabledTools.length}</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="local-note">
            <span className="status-dot" />
            此浏览器的个人空间
          </div>
          <button className="profile" onClick={() => setAboutOpen(true)}>
            <span className="avatar">A</span>
            <span>
              <strong>Astra Workspace</strong>
              <small>让思考，自由发生</small>
            </span>
            <Info size={16} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            {!sidebar && (
              <button
                className="icon-button"
                onClick={() => setSidebar(true)}
                aria-label="展开侧栏"
              >
                <PanelLeft size={19} />
              </button>
            )}
            <div className="model-picker">
              <button
                className="model-button"
                onClick={() => setModelsOpen(!modelsOpen)}
                aria-expanded={modelsOpen}
              >
                <strong>Astra</strong>
                <span>{modelName}</span>
                <ChevronDown size={14} />
              </button>
              {modelsOpen && (
                <>
                  <button
                    aria-label="关闭模型菜单"
                    className="menu-scrim"
                    onClick={() => setModelsOpen(false)}
                  />
                  <div className="model-menu">
                    <div className="menu-label">选择 AI 模型</div>
                    {config.isLoading ? (
                      <div className="menu-loading">
                        <Loader2 size={16} className="spin" />
                        正在加载模型
                      </div>
                    ) : config.isError ? (
                      <div className="menu-loading">
                        加载失败<button onClick={() => void config.refetch()}>重试</button>
                      </div>
                    ) : (
                      config.data?.models.map((m) => (
                        <button
                          key={m.id}
                          disabled={busy}
                          onClick={() => {
                            setModel(m.id);
                            setModelsOpen(false);
                          }}
                        >
                          <div>
                            <strong>{m.name}</strong>
                            <span>{m.detail}</span>
                          </div>
                          {model === m.id && <Check size={16} />}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <span className={`status-dot ${config.data?.configured ? "" : "offline"}`} />
              {config.isLoading ? "连接中" : config.data?.configured ? "AI 已连接" : "连接不可用"}
            </span>
            <span className="topbar-divider" />
            <button className="topbar-tool" onClick={() => setToolsOpen(true)}>
              <Wrench size={15} />
              <span>工具已就绪</span>
            </button>
          </div>
        </header>
        {(config.isError || (config.data && !config.data.configured)) && (
          <div className="service-error">
            AI 服务连接不可用。<button onClick={() => void config.refetch()}>重新连接</button>
          </div>
        )}
        {storageError && (
          <div className="service-error">
            浏览器存储已满或不可用，当前记录未能保存。请导出重要会话。
          </div>
        )}
        <Chat
          key={active.id}
          conversation={active}
          history={history}
          model={model}
          modelName={modelName}
          enabledTools={enabledTools}
          onMessages={onMessages}
          onBusy={setBusy}
          openTools={() => setToolsOpen(true)}
          ready={Boolean(config.data?.configured)}
        />
      </main>
      {toolsOpen && (
        <ToolPanel
          tools={config.data?.tools ?? []}
          enabled={enabledTools}
          toggle={(id) =>
            setEnabledTools((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          close={closeTools}
        />
      )}
      {aboutOpen && (
        <Modal className="about-dialog" label="关于 Astra" close={() => setAboutOpen(false)}>
          <button
            className="dialog-close icon-button"
            aria-label="关闭"
            onClick={() => setAboutOpen(false)}
          >
            <X size={18} />
          </button>
          <AstraMark />
          <h2>你的思考伙伴。</h2>
          <p>
            Astra 连接真实 AI 模型，支持多步工具调用。它是独立的 AI 工作台，不会读取 Runable
            主会话或你的私人记忆。
          </p>
          <div className="about-detail">
            <strong>记录保存在这里</strong>
            <span>
              会话仅保存在当前浏览器，不跨设备同步。清除浏览器数据会移除记录，请使用会话菜单导出重要内容。
            </span>
          </div>
          <button className="primary-button" onClick={() => setAboutOpen(false)}>
            开始探索
          </button>
        </Modal>
      )}
      {(renameId || deleteId) && (
        <Modal
          className="small-dialog"
          label={renameId ? "重命名会话" : "删除会话"}
          close={() => {
            setRenameId(null);
            setDeleteId(null);
          }}
        >
          <h2>{renameId ? "重命名会话" : "删除这个会话？"}</h2>
          {renameId ? (
            <input
              aria-label="会话名称"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
              }}
            />
          ) : (
            <p>删除后无法恢复。你可以先从会话菜单导出记录。</p>
          )}
          <div className="dialog-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setRenameId(null);
                setDeleteId(null);
              }}
            >
              取消
            </button>
            <button
              className={`primary-button ${deleteId ? "delete-button" : ""}`}
              disabled={Boolean(renameId && !renameText.trim())}
              onClick={() => {
                if (renameId) commitRename();
                else {
                  setHistory((prev) => prev.filter((c) => c.id !== deleteId));
                  if (activeId === deleteId) {
                    setDraft(newConversation());
                    setActiveId(null);
                  }
                  setDeleteId(null);
                }
              }}
            >
              {renameId ? "保存" : "删除"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
