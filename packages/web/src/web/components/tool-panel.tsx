import {
  X,
  Wrench,
  Calculator,
  Clock3,
  CalendarDays,
  ArrowLeftRight,
  FileJson2,
  TextCursorInput,
  Shuffle,
  Search,
  Info,
} from "lucide-react";
import { Modal } from "./modal";
const icons: Record<string, typeof Wrench> = {
  calculator: Calculator,
  currentTime: Clock3,
  dateMath: CalendarDays,
  convertUnit: ArrowLeftRight,
  formatJson: FileJson2,
  textStats: TextCursorInput,
  randomNumber: Shuffle,
  searchHistory: Search,
};
export type ToolInfo = { id: string; name: string; description: string; category: string };
export function ToolPanel({
  tools,
  enabled,
  toggle,
  close,
}: {
  tools: ToolInfo[];
  enabled: string[];
  toggle: (id: string) => void;
  close: () => void;
}) {
  return (
    <Modal className="tool-panel" label="工具箱" close={close}>
      <header>
        <div>
          <div className="eyebrow">ASTRA TOOLKIT</div>
          <h2>让想法，变成行动。</h2>
        </div>
        <button className="icon-button" onClick={close} aria-label="关闭工具箱">
          <X size={20} />
        </button>
      </header>
      <p className="panel-description">
        Astra 会按需调用已启用的工具，并在对话中展示实际执行结果。
      </p>
      <div className="tool-summary">
        <Wrench size={17} />
        <span>{enabled.length} 个工具已启用</span>
        <span className="status-dot" />
      </div>
      <div className="tool-list">
        {["计算与数据", "日常效率"].map((category) => (
          <div key={category}>
            <h3>{category}</h3>
            {tools
              .filter((t) => t.category === category)
              .map((t) => {
                const Icon = icons[t.id] ?? Wrench;
                const checked = enabled.includes(t.id);
                return (
                  <button
                    key={t.id}
                    className="tool-row"
                    role="switch"
                    aria-checked={checked}
                    aria-label={`${t.name}工具`}
                    onClick={() => toggle(t.id)}
                  >
                    <span className="tool-icon">
                      <Icon size={19} />
                    </span>
                    <span className="tool-row-copy">
                      <strong>{t.name}</strong>
                      <span>{t.description}</span>
                    </span>
                    <span className={`toggle ${checked ? "checked" : ""}`}>
                      <i />
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
      <div className="panel-footnote">
        <Info size={16} />
        <p>工具在服务器真实执行。目前不包含联网搜索、文件读写或平台主会话的私人记忆。</p>
      </div>
    </Modal>
  );
}
