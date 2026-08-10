import { create } from "zustand";
import { persist } from "zustand/middleware";
import { diffStat } from "./diff";

export type EntryType = "file" | "dir";
export type Entry = { type: EntryType; content: string };
export type ActivityStatus = "running" | "done" | "warn" | "fail";

export type Activity = { id: string; label: string; status: ActivityStatus; detail?: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  streaming?: boolean;
  error?: boolean;
};

export type PendingChange = {
  id: string;
  path: string;
  before: string | null;
  after: string | null;
  kind: "create" | "modify" | "delete";
};

export type Settings = {
  apiKey: string;
  model: string;
  temperature: number;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  accent: "purple" | "blue" | "green";
};

export type Commit = { id: string; message: string; at: number; files: string[] };
export type TerminalLine = { id: string; text: string; tone?: "in" | "out" | "err" | "muted" };
export type TerminalSession = { id: string; name: string; lines: TerminalLine[]; history: string[]; cwd: string };
export type PreviewState = { path: string; html: string; nonce: number };

export type Problem = { path: string; line: number; message: string; severity: "error" | "warning" };

export const GROQ_MODEL = "llama-3.3-70b-versatile";

const uid = () => Math.random().toString(36).slice(2, 10);

export const IGNORED = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "venv",
  ".venv",
  "__pycache__",
  ".env",
  ".env.local",
];

export function isIgnored(path: string) {
  return IGNORED.some((part) => path === part || path.startsWith(`${part}/`) || path.includes(`/${part}/`) || path.endsWith(`/${part}`));
}

function parentDirs(path: string) {
  const parts = path.split("/");
  parts.pop();
  const dirs: string[] = [];
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    dirs.push(current);
  }
  return dirs;
}

export function normalizePath(input: string) {
  const cleaned = input.replace(/\\/g, "/").replace(/^\.?\//, "").trim();
  const out: string[] = [];
  for (const segment of cleaned.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      out.pop(); // never escape the workspace
      continue;
    }
    out.push(segment);
  }
  return out.join("/");
}

export type Workspace = {
  projectName: string | null;
  files: Record<string, Entry>;
  baseline: Record<string, string>;
  staged: string[];
  commits: Commit[];
  recents: { name: string; at: number; kind: string }[];

  tabs: string[];
  active: string | null;
  buffers: Record<string, string>;
  expanded: Record<string, boolean>;
  jumpToLine: { path: string; line: number; nonce: number } | null;

  settings: Settings;
  panels: { explorer: boolean; agent: boolean; bottom: boolean };
  bottomTab: "terminal" | "problems" | "output" | "git" | "preview";

  chat: ChatMessage[];
  activity: Activity[];
  pending: PendingChange[];
  agentRunning: boolean;

  terminals: TerminalSession[];
  activeTerminal: string;
  output: TerminalLine[];
  problems: Problem[];
  installed: string[];
  preview: PreviewState | null;
};

type Actions = {
  openProject: (name: string, files: Record<string, string>, kind?: string) => void;
  mergeFiles: (files: Record<string, string>, projectName?: string) => number;
  closeProject: () => void;

  listPaths: () => string[];
  readFile: (path: string) => string | null;
  writeFile: (path: string, content: string) => void;
  createEntry: (path: string, type: EntryType, content?: string) => string | null;
  deleteEntry: (path: string) => void;
  renameEntry: (from: string, to: string) => void;

  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setActive: (path: string) => void;
  setBuffer: (path: string, content: string) => void;
  saveTab: (path: string) => void;
  requestJump: (path: string, line: number) => void;
  toggleDir: (path: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  togglePanel: (key: keyof Workspace["panels"]) => void;
  setBottomTab: (tab: Workspace["bottomTab"]) => void;

  pushChat: (message: Omit<ChatMessage, "id">) => string;
  appendChat: (id: string, chunk: string) => void;
  finishChat: (id: string) => void;
  clearChat: () => void;
  pushActivity: (label: string) => string;
  setActivityStatus: (id: string, status: ActivityStatus, detail?: string) => void;
  clearActivity: () => void;
  setAgentRunning: (running: boolean) => void;

  proposeChange: (change: Omit<PendingChange, "id">) => void;
  applyChange: (id: string) => void;
  rejectChange: (id: string) => void;
  applyAllChanges: () => void;
  rejectAllChanges: () => void;

  stage: (path: string) => void;
  unstage: (path: string) => void;
  discard: (path: string) => void;
  commit: (message: string) => void;

  newTerminal: (cwd?: string) => void;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  setTerminalCwd: (id: string, cwd: string) => void;
  openFolderInTerminal: (path: string) => void;
  pushTerminal: (id: string, line: Omit<TerminalLine, "id">) => void;
  clearTerminal: (id: string) => void;
  pushHistory: (id: string, command: string) => void;
  pushOutput: (text: string, tone?: TerminalLine["tone"]) => void;
  setProblems: (problems: Problem[]) => void;
  setInstalled: (packages: string[]) => void;
  setPreview: (preview: PreviewState | null) => void;
};

const defaultSettings: Settings = {
  apiKey: "",
  model: GROQ_MODEL,
  temperature: 0.2,
  fontSize: 13,
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  lineNumbers: true,
  autoSave: false,
  accent: "purple",
};

function freshTerminal(index: number, cwd = ""): TerminalSession {
  return {
    id: uid(),
    name: `Terminal ${index}`,
    lines: [{ id: uid(), text: "AI Dev Studio workspace shell — type `help` for supported commands.", tone: "muted" }],
    history: [],
    cwd,
  };
}

export const useIde = create<Workspace & Actions>()(
  persist(
    (set, get) => ({
      projectName: null,
      files: {},
      baseline: {},
      staged: [],
      commits: [],
      recents: [],
      tabs: [],
      active: null,
      buffers: {},
      expanded: {},
      jumpToLine: null,
      settings: defaultSettings,
      panels: { explorer: true, agent: true, bottom: true },
      bottomTab: "terminal",
      chat: [],
      activity: [],
      pending: [],
      agentRunning: false,
      terminals: [freshTerminal(1)],
      activeTerminal: "",
      output: [],
      problems: [],
      installed: [],
      preview: null,

      mergeFiles: (seed, projectName) => {
        let count = 0;
        set((state) => {
          const files = { ...state.files };
          const baseline = { ...state.baseline };
          const expanded = { ...state.expanded };
          for (const [rawPath, content] of Object.entries(seed)) {
            const path = normalizePath(rawPath);
            if (!path) continue;
            for (const dir of parentDirs(path)) {
              if (!files[dir]) files[dir] = { type: "dir", content: "" };
              expanded[dir] = true;
            }
            files[path] = { type: "file", content };
            baseline[path] = content;
            count += 1;
          }
          return { files, baseline, expanded, projectName: state.projectName ?? projectName ?? "workspace" };
        });
        return count;
      },


      openProject: (name, seed, kind = "Unknown") => {
        const files: Record<string, Entry> = {};
        for (const [rawPath, content] of Object.entries(seed)) {
          const path = normalizePath(rawPath);
          for (const dir of parentDirs(path)) files[dir] = { type: "dir", content: "" };
          files[path] = { type: "file", content };
        }
        const expanded: Record<string, boolean> = {};
        Object.entries(files).forEach(([path, entry]) => {
          if (entry.type === "dir") expanded[path] = true;
        });
        const baseline: Record<string, string> = {};
        Object.entries(files).forEach(([path, entry]) => {
          if (entry.type === "file") baseline[path] = entry.content;
        });
        const recents = [
          { name, at: Date.now(), kind },
          ...get().recents.filter((r) => r.name !== name),
        ].slice(0, 6);
        const first = Object.keys(files).find((p) => files[p]!.type === "file" && p.toLowerCase().includes("readme"));
        set({
          projectName: name,
          files,
          baseline,
          staged: [],
          commits: [],
          expanded,
          recents,
          tabs: first ? [first] : [],
          active: first ?? null,
          buffers: {},
          chat: [],
          activity: [],
          pending: [],
          problems: [],
          terminals: [freshTerminal(1)],
        });
      },

      closeProject: () =>
        set({ projectName: null, files: {}, tabs: [], active: null, buffers: {}, chat: [], activity: [], pending: [] }),

      listPaths: () =>
        Object.keys(get().files)
          .filter((path) => get().files[path]!.type === "file" && !isIgnored(path))
          .sort(),

      readFile: (path) => {
        const entry = get().files[normalizePath(path)];
        return entry && entry.type === "file" ? entry.content : null;
      },

      writeFile: (path, content) => {
        const clean = normalizePath(path);
        if (!clean) return;
        set((state) => {
          const files = { ...state.files };
          for (const dir of parentDirs(clean)) if (!files[dir]) files[dir] = { type: "dir", content: "" };
          files[clean] = { type: "file", content };
          const buffers = { ...state.buffers };
          delete buffers[clean];
          return { files, buffers };
        });
      },

      createEntry: (path, type, content = "") => {
        const clean = normalizePath(path);
        if (!clean) return "Invalid path";
        if (get().files[clean]) return "Path already exists";
        set((state) => {
          const files = { ...state.files };
          for (const dir of parentDirs(clean)) if (!files[dir]) files[dir] = { type: "dir", content: "" };
          files[clean] = { type, content: type === "file" ? content : "" };
          const expanded = { ...state.expanded };
          for (const dir of parentDirs(clean)) expanded[dir] = true;
          if (type === "dir") expanded[clean] = true;
          return { files, expanded };
        });
        return null;
      },

      deleteEntry: (path) => {
        const clean = normalizePath(path);
        set((state) => {
          const files = { ...state.files };
          const buffers = { ...state.buffers };
          for (const key of Object.keys(files)) {
            if (key === clean || key.startsWith(`${clean}/`)) {
              delete files[key];
              delete buffers[key];
            }
          }
          const tabs = state.tabs.filter((tab) => tab !== clean && !tab.startsWith(`${clean}/`));
          return {
            files,
            buffers,
            tabs,
            active: state.active && tabs.includes(state.active) ? state.active : (tabs[0] ?? null),
            staged: state.staged.filter((p) => p !== clean),
          };
        });
      },

      renameEntry: (from, to) => {
        const a = normalizePath(from);
        const b = normalizePath(to);
        if (!a || !b || a === b) return;
        set((state) => {
          const files: Record<string, Entry> = {};
          for (const [key, entry] of Object.entries(state.files)) {
            if (key === a) files[b] = entry;
            else if (key.startsWith(`${a}/`)) files[b + key.slice(a.length)] = entry;
            else files[key] = entry;
          }
          for (const dir of parentDirs(b)) if (!files[dir]) files[dir] = { type: "dir", content: "" };
          const tabs = state.tabs.map((tab) => (tab === a ? b : tab.startsWith(`${a}/`) ? b + tab.slice(a.length) : tab));
          return { files, tabs, active: state.active === a ? b : state.active };
        });
      },

      openTab: (path) =>
        set((state) => ({
          tabs: state.tabs.includes(path) ? state.tabs : [...state.tabs, path],
          active: path,
        })),

      closeTab: (path) =>
        set((state) => {
          const tabs = state.tabs.filter((tab) => tab !== path);
          const buffers = { ...state.buffers };
          delete buffers[path];
          return { tabs, buffers, active: state.active === path ? (tabs[tabs.length - 1] ?? null) : state.active };
        }),

      setActive: (path) => set({ active: path }),

      setBuffer: (path, content) =>
        set((state) => {
          if (state.settings.autoSave) {
            const files = { ...state.files, [path]: { type: "file" as EntryType, content } };
            const buffers = { ...state.buffers };
            delete buffers[path];
            return { files, buffers };
          }
          const entry = state.files[path];
          if (entry && entry.content === content) {
            const buffers = { ...state.buffers };
            delete buffers[path];
            return { buffers };
          }
          return { buffers: { ...state.buffers, [path]: content } };
        }),

      saveTab: (path) => {
        const buffered = get().buffers[path];
        if (buffered === undefined) return;
        get().writeFile(path, buffered);
      },

      requestJump: (path, line) => set({ jumpToLine: { path, line, nonce: Date.now() } }),
      toggleDir: (path) => set((state) => ({ expanded: { ...state.expanded, [path]: !state.expanded[path] } })),

      setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      togglePanel: (key) => set((state) => ({ panels: { ...state.panels, [key]: !state.panels[key] } })),
      setBottomTab: (tab) => set((state) => ({ bottomTab: tab, panels: { ...state.panels, bottom: true } })),

      pushChat: (message) => {
        const id = uid();
        set((state) => ({ chat: [...state.chat, { ...message, id }] }));
        return id;
      },
      appendChat: (id, chunk) =>
        set((state) => ({
          chat: state.chat.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
        })),
      finishChat: (id) =>
        set((state) => ({ chat: state.chat.map((m) => (m.id === id ? { ...m, streaming: false } : m)) })),
      clearChat: () => set({ chat: [], activity: [], pending: [] }),

      pushActivity: (label) => {
        const id = uid();
        set((state) => ({ activity: [...state.activity, { id, label, status: "running" }] }));
        return id;
      },
      setActivityStatus: (id, status, detail) =>
        set((state) => ({
          activity: state.activity.map((a) =>
            a.id === id ? { ...a, status, ...(detail === undefined ? {} : { detail }) } : a,
          ),
        })),

      clearActivity: () => set({ activity: [] }),
      setAgentRunning: (agentRunning) => set({ agentRunning }),

      proposeChange: (change) => set((state) => ({ pending: [...state.pending, { ...change, id: uid() }] })),
      applyChange: (id) => {
        const change = get().pending.find((c) => c.id === id);
        if (!change) return;
        if (change.kind === "delete") get().deleteEntry(change.path);
        else get().writeFile(change.path, change.after ?? "");
        set((state) => ({ pending: state.pending.filter((c) => c.id !== id) }));
      },
      rejectChange: (id) => set((state) => ({ pending: state.pending.filter((c) => c.id !== id) })),
      applyAllChanges: () => {
        for (const change of [...get().pending]) get().applyChange(change.id);
      },
      rejectAllChanges: () => set({ pending: [] }),

      stage: (path) => set((state) => ({ staged: Array.from(new Set([...state.staged, path])) })),
      unstage: (path) => set((state) => ({ staged: state.staged.filter((p) => p !== path) })),
      discard: (path) => {
        const base = get().baseline[path];
        if (base === undefined) get().deleteEntry(path);
        else get().writeFile(path, base);
        set((state) => ({ staged: state.staged.filter((p) => p !== path) }));
      },
      commit: (message) => {
        const staged = get().staged;
        if (!staged.length || !message.trim()) return;
        set((state) => {
          const baseline = { ...state.baseline };
          for (const path of staged) {
            const entry = state.files[path];
            if (entry && entry.type === "file") baseline[path] = entry.content;
            else delete baseline[path];
          }
          return {
            baseline,
            staged: [],
            commits: [{ id: uid(), message: message.trim(), at: Date.now(), files: staged }, ...state.commits],
          };
        });
      },

      newTerminal: (cwd) =>
        set((state) => {
          const session = freshTerminal(state.terminals.length + 1, cwd ?? "");
          return { terminals: [...state.terminals, session], activeTerminal: session.id };
        }),
      closeTerminal: (id) =>
        set((state) => {
          const terminals = state.terminals.filter((t) => t.id !== id);
          return { terminals, activeTerminal: terminals[0]?.id ?? "" };
        }),
      setActiveTerminal: (id) => set({ activeTerminal: id }),
      setTerminalCwd: (id, cwd) =>
        set((state) => ({ terminals: state.terminals.map((t) => (t.id === id ? { ...t, cwd: normalizePath(cwd) } : t)) })),
      openFolderInTerminal: (path) => {
        const clean = normalizePath(path);
        const state = get();
        const id = state.activeTerminal || state.terminals[0]?.id;
        if (!id) {
          get().newTerminal(clean);
        } else {
          get().setTerminalCwd(id, clean);
          set({ activeTerminal: id });
          get().pushTerminal(id, { text: `cd ${clean || "/"}`, tone: "muted" });
        }
        set((s) => ({ bottomTab: "terminal", panels: { ...s.panels, bottom: true } }));
      },
      pushTerminal: (id, line) =>
        set((state) => ({
          terminals: state.terminals.map((t) =>
            t.id === id ? { ...t, lines: [...t.lines, { ...line, id: uid() }].slice(-500) } : t,
          ),
        })),
      clearTerminal: (id) =>
        set((state) => ({ terminals: state.terminals.map((t) => (t.id === id ? { ...t, lines: [] } : t)) })),
      pushHistory: (id, command) =>
        set((state) => ({
          terminals: state.terminals.map((t) => (t.id === id ? { ...t, history: [...t.history, command].slice(-100) } : t)),
        })),
      pushOutput: (text, tone = "out") =>
        set((state) => ({ output: [...state.output, { id: uid(), text, tone }].slice(-300) })),
      setProblems: (problems) => set({ problems }),
      setInstalled: (installed) => set({ installed }),
      setPreview: (preview) => set((state) => ({ preview, bottomTab: preview ? "preview" : state.bottomTab, panels: { ...state.panels, bottom: true } })),
    }),
    {
      name: "ai-dev-studio",
      partialize: (state) => ({
        projectName: state.projectName,
        files: state.files,
        baseline: state.baseline,
        staged: state.staged,
        commits: state.commits,
        recents: state.recents,
        tabs: state.tabs,
        active: state.active,
        expanded: state.expanded,
        settings: state.settings,
        panels: state.panels,
        bottomTab: state.bottomTab,
      }),
    },
  ),
);

export type GitChange = { path: string; status: "M" | "A" | "D"; additions: number; deletions: number };

export function gitChanges(state: Workspace): GitChange[] {
  const changes: GitChange[] = [];
  const seen = new Set<string>();
  for (const [path, entry] of Object.entries(state.files)) {
    if (entry.type !== "file" || isIgnored(path)) continue;
    seen.add(path);
    const base = state.baseline[path];
    if (base === undefined) {
      changes.push({ path, status: "A", ...diffStat("", entry.content) });
    } else if (base !== entry.content) {
      changes.push({ path, status: "M", ...diffStat(base, entry.content) });
    }
  }
  for (const [path, base] of Object.entries(state.baseline)) {
    if (!seen.has(path)) changes.push({ path, status: "D", ...diffStat(base, "") });
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path));
}

export function fileLanguage(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    py: "python",
    md: "markdown",
    css: "css",
    html: "html",
    yml: "yaml",
    yaml: "yaml",
    sh: "shell",
    toml: "ini",
    txt: "plaintext",
    rs: "rust",
    go: "go",
    java: "java",
  };
  return map[ext] ?? "plaintext";
}

export function detectProjectType(files: Record<string, Entry>) {
  const has = (path: string) => Boolean(files[path]);
  const pkg = files["package.json"]?.content ?? "";
  if (has("package.json")) {
    if (pkg.includes('"next"')) return "Next.js";
    if (pkg.includes('"react"')) return pkg.includes('"typescript"') || Object.keys(files).some((p) => p.endsWith(".tsx")) ? "React + TypeScript" : "React";
    if (Object.keys(files).some((p) => p.endsWith(".ts"))) return "Node + TypeScript";
    return "Node.js";
  }
  if (has("requirements.txt") || has("pyproject.toml")) return "Python";
  if (has("Cargo.toml")) return "Rust";
  if (has("go.mod")) return "Go";
  if (has("pom.xml") || has("build.gradle")) return "Java";
  if (has("index.html")) return "Static Web";
  return "Unknown";
}
