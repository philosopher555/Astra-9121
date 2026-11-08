 # Astra — Design

Web-only, Chinese-first AI workspace. Quiet, white, editorial and precise. No decorative photos or gradients.

## Visual system
- Background #fff; sidebar #fafafa; ink #242424; secondary #8b8b8b; lines #eaeaea; small sage-green status dot.
- Display Poppins with Noto Sans SC fallback; body Poppins, system Chinese sans. Headline 36px, body 14px, labels 12px. Brand wordmark 24px with tight spacing.
- 260px fixed sidebar, 64px toolbar, centered content max-width 760px. Ample negative space. Fine borders, 10–16px radii, no heavy shadows except floating dialogs.
- Astra mark: simple black four-point star. Icons are Lucide, 17–20px. Black primary send button.
- Empty state: mark, greeting, short promise, large composer, three restrained prompt suggestions, subtle tool-count caption.
- Chats: readable Markdown, human right-aligned pale bubbles, assistant flat content, expandable true tool results.
- Motion: subtle initial fade and button transitions, respects reduced motion.

## Flows and implementation
- New chat, local persistent history, search history, rename/delete/export, model picker, tool drawer, stream/stop/retry and copy.
- Conversations are saved in this browser only; clearly explain no cross-device sync. No auth required. No database tables in this first version.
- API: oRPC agent.config catalog; streaming /api/agent/messages through managed gateway. Default openai/gpt-5.4-mini; optional anthropic/claude-sonnet-5.
- Eight genuine server tools: calculator, current time, date math, unit conversion, text statistics, JSON formatting, secure random integer, history search. History tool only sees browser-supplied history.
- Files: API agent/gateway.ts, agent/tools.ts, agent/chat.ts, routes/agent.ts; web pages/astra.tsx, components/chat.tsx, components/tool-panel.tsx, lib/history.ts, queries/agent.ts, styles.css.
- Mobile viewport: collapsible sidebar overlay, full-width composer. All icons have accessible names, focus states and errors visible.