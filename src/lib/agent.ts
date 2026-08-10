import { diffLines } from "./diff";
import { isDangerous, runShellCollect } from "./shell";
import { detectProjectType, gitChanges, isIgnored, useIde, type Workspace } from "./ide-store";

export type GroqMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
  name?: string;
};

const SYSTEM_PROMPT = `You are the AI engineer inside AI Dev Studio, an in-browser IDE. You work on the user's cloud workspace through tools.

Rules you must follow:
1. Never assume file contents — call read_file first.
2. Use list_files / search_code to locate relevant code before answering.
3. Make minimal, safe changes that fit the project's existing conventions.
4. File writes are proposed as diffs and require the user's approval; say so instead of claiming a file was changed.
5. Never claim a command ran or tests passed unless a tool result proves it.
6. Never print secrets or .env contents.
7. Explain reasoning briefly, then give concrete results.
8. Reference code as \`path/to/file.ts:42\` so the user can click through.
9. Answer in Markdown with fenced code blocks.
10. The workspace shell performs real file/search/git operations only; it has no process runtime, so do not pretend to install packages or run test suites.`;

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List every file path in the workspace.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full contents of one file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "Workspace-relative path" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_code",
      description: "Search file contents for a string and return path:line matches.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Propose new full contents for an existing file. The user reviews the diff and approves it.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Propose creating a new file with contents. The user approves before it is created.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Propose deleting a file. The user approves before it is deleted.",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_file",
      description: "Rename or move a file immediately.",
      parameters: {
        type: "object",
        properties: { from: { type: "string" }, to: { type: "string" } },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Run a workspace shell command (ls, cat, tree, grep, find, mkdir, touch, rm, mv, wc, git status/diff/log). No process runtime.",
      parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_git_status",
      description: "List changed files versus the last commit.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_git_diff",
      description: "Get the unified diff of uncommitted changes.",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: [] },
    },
  },
] as const;

const MAX_FILE_CHARS = 12000;

function truncate(text: string, limit = MAX_FILE_CHARS) {
  return text.length > limit ? `${text.slice(0, limit)}\n… [truncated ${text.length - limit} chars]` : text;
}

export function buildProjectContext(state: Workspace) {
  const paths = Object.keys(state.files)
    .filter((path) => state.files[path]!.type === "file" && !isIgnored(path))
    .sort();
  const active = state.active;
  const activeContent = active ? state.files[active]?.content ?? "" : "";
  const changes = gitChanges(state);
  return [
    `Project: ${state.projectName ?? "unknown"} (${detectProjectType(state.files)})`,
    `Files (${paths.length}):`,
    paths.map((p) => `  ${p}`).join("\n"),
    changes.length ? `Uncommitted changes: ${changes.map((c) => `${c.status} ${c.path}`).join(", ")}` : "Working tree clean.",
    active ? `Active file: ${active}\n\`\`\`\n${truncate(activeContent, 6000)}\n\`\`\`` : "No file open.",
  ].join("\n");
}

function unifiedDiff(path: string, before: string, after: string) {
  const body = diffLines(before, after)
    .map((line) => (line.type === "add" ? `+${line.text}` : line.type === "del" ? `-${line.text}` : ` ${line.text}`))
    .join("\n");
  return `--- a/${path}\n+++ b/${path}\n${truncate(body, 8000)}`;
}

export async function executeTool(name: string, rawArgs: string): Promise<string> {
  const store = useIde.getState();
  let args: Record<string, string> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, string>) : {};
  } catch {
    return "Error: tool arguments were not valid JSON.";
  }
  const state = useIde.getState() as Workspace;

  switch (name) {
    case "list_files":
      return store.listPaths().join("\n") || "(empty workspace)";
    case "read_file": {
      const path = args["path"] ?? "";
      if (isIgnored(path)) return "Error: this path is excluded from AI context.";
      const content = store.readFile(path);
      return content === null ? `Error: ${path} does not exist.` : truncate(content);
    }
    case "search_code": {
      const query = (args["query"] ?? "").toLowerCase();
      if (!query) return "Error: query is required.";
      const hits: string[] = [];
      for (const path of store.listPaths()) {
        (store.readFile(path) ?? "").split("\n").forEach((line, index) => {
          if (line.toLowerCase().includes(query)) hits.push(`${path}:${index + 1}: ${line.trim().slice(0, 200)}`);
        });
      }
      return hits.length ? hits.slice(0, 80).join("\n") : `No matches for "${args["query"]}".`;
    }
    case "write_file":
    case "create_file": {
      const path = args["path"] ?? "";
      const content = args["content"] ?? "";
      if (!path) return "Error: path is required.";
      if (isIgnored(path)) return "Error: writing to this path is not allowed.";
      const before = store.readFile(path);
      if (before === content) return `${path} already has that exact content — no change proposed.`;
      store.proposeChange({
        path,
        before,
        after: content,
        kind: before === null ? "create" : "modify",
      });
      return `Change proposed for ${path} (${before === null ? "new file" : "modification"}). Waiting for the user to review and approve the diff.`;
    }
    case "delete_file": {
      const path = args["path"] ?? "";
      const before = store.readFile(path);
      if (before === null) return `Error: ${path} does not exist.`;
      store.proposeChange({ path, before, after: null, kind: "delete" });
      return `Deletion of ${path} proposed. Waiting for user approval.`;
    }
    case "rename_file": {
      const from = args["from"] ?? "";
      const to = args["to"] ?? "";
      if (!state.files[from]) return `Error: ${from} does not exist.`;
      store.renameEntry(from, to);
      return `Renamed ${from} to ${to}.`;
    }
    case "run_command": {
      const command = args["command"] ?? "";
      if (!command) return "Error: command is required.";
      if (isDangerous(command)) {
        const ok = typeof window !== "undefined" && window.confirm(`The AI wants to run a potentially destructive command:\n\n${command}\n\nAllow it?`);
        if (!ok) return "The user denied this command.";
      }
      const cwd = state.terminals.find((t) => t.id === state.activeTerminal)?.cwd ?? "";
      const result = await runShellCollect(command, cwd);
      const terminalId = state.activeTerminal || state.terminals[0]?.id;
      if (terminalId) {
        store.pushTerminal(terminalId, { text: `$ ${command}`, tone: "in" });
        result.lines.forEach((line: { text: string; tone?: "out" | "err" | "muted" }) =>
          store.pushTerminal(terminalId, line),
        );
      }
      return result.lines.map((line: { text: string }) => line.text).join("\n") || "(no output)";
    }
    case "get_git_status": {
      const changes = gitChanges(state);
      return changes.length
        ? changes.map((c) => `${c.status} ${c.path} +${c.additions} -${c.deletions}`).join("\n")
        : "Working tree clean.";
    }
    case "get_git_diff": {
      const only = args["path"];
      const changes = gitChanges(state).filter((c) => !only || c.path === only);
      if (!changes.length) return "No uncommitted changes.";
      return changes
        .map((c) => unifiedDiff(c.path, state.baseline[c.path] ?? "", store.readFile(c.path) ?? ""))
        .join("\n\n");
    }
    default:
      return `Error: unknown tool ${name}.`;
  }
}

/** Session memory: what the agent has seen this session (cleared with the chat). */
let conversation: GroqMessage[] = [];
export function resetConversation() {
  conversation = [];
}

type StreamedToolCall = { id: string; name: string; args: string };

async function streamOnce(
  messages: GroqMessage[],
  onText: (chunk: string) => void,
  signal: AbortSignal,
): Promise<{ text: string; toolCalls: StreamedToolCall[] }> {
  const { settings } = useIde.getState();
  const response = await fetch("/api/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      apiKey: settings.apiKey,
      model: settings.model,
      temperature: settings.temperature,
      messages,
      tools: TOOLS,
    }),
  });

  if (!response.ok || !response.body) {
    let message = `Groq request failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const calls: StreamedToolCall[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n");
    buffer = events.pop() ?? "";
    for (const line of events) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let parsed: {
        choices?: {
          delta?: {
            content?: string | null;
            tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
          };
        }[];
      };
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = parsed.choices?.[0]?.delta;
      if (delta?.content) {
        text += delta.content;
        onText(delta.content);
      }
      for (const call of delta?.tool_calls ?? []) {
        const slot = (calls[call.index] ??= { id: call.id ?? `call_${call.index}`, name: "", args: "" });
        if (call.id) slot.id = call.id;
        if (call.function?.name) slot.name += call.function.name;
        if (call.function?.arguments) slot.args += call.function.arguments;
      }
    }
  }

  return { text, toolCalls: calls.filter(Boolean) };
}

const TOOL_LABELS: Record<string, (args: Record<string, string>) => string> = {
  list_files: () => "Listed project files",
  read_file: (a) => `Read ${a["path"] ?? "file"}`,
  search_code: (a) => `Searched for "${a["query"] ?? ""}"`,
  write_file: (a) => `Proposed change to ${a["path"] ?? "file"}`,
  create_file: (a) => `Proposed new file ${a["path"] ?? ""}`,
  delete_file: (a) => `Proposed deleting ${a["path"] ?? ""}`,
  rename_file: (a) => `Renamed ${a["from"] ?? ""}`,
  run_command: (a) => `Ran \`${a["command"] ?? ""}\``,
  get_git_status: () => "Checked git status",
  get_git_diff: () => "Read git diff",
};

function labelFor(name: string, rawArgs: string) {
  let args: Record<string, string> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, string>) : {};
  } catch {
    /* ignore */
  }
  return TOOL_LABELS[name]?.(args) ?? `Used ${name}`;
}

export async function runAgent(prompt: string, signal: AbortSignal) {
  const store = useIde.getState();
  store.setAgentRunning(true);
  store.pushChat({ role: "user", content: prompt });

  if (!conversation.length) {
    conversation = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Workspace snapshot:\n${buildProjectContext(useIde.getState() as Workspace)}` },
    ];
  }
  conversation.push({ role: "user", content: prompt });

  try {
    for (let step = 0; step < 8; step++) {
      let assistantId: string | null = null;
      const { text, toolCalls } = await streamOnce(
        conversation,
        (chunk) => {
          if (!assistantId) assistantId = store.pushChat({ role: "assistant", content: "", streaming: true });
          store.appendChat(assistantId, chunk);
        },
        signal,
      );
      if (assistantId) store.finishChat(assistantId);

      if (!toolCalls.length) {
        if (!text.trim() && !assistantId) {
          store.pushChat({ role: "assistant", content: "_The model returned an empty response. Try again._" });
        }
        conversation.push({ role: "assistant", content: text });
        return;
      }

      conversation.push({
        role: "assistant",
        content: text || null,
        tool_calls: toolCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: call.args || "{}" },
        })),
      });

      for (const call of toolCalls) {
        const activityId = store.pushActivity(labelFor(call.name, call.args));
        let result: string;
        try {
          result = await executeTool(call.name, call.args || "{}");
        } catch (error) {
          result = `Error: ${(error as Error).message}`;
        }
        const failed = result.startsWith("Error:");
        const waiting = result.includes("Waiting for");
        store.setActivityStatus(activityId, failed ? "fail" : waiting ? "warn" : "done");
        conversation.push({ role: "tool", tool_call_id: call.id, name: call.name, content: truncate(result, 8000) });
      }
    }
    store.pushChat({ role: "assistant", content: "_Stopped after 8 tool steps to avoid a loop. Ask me to continue._" });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      store.pushChat({ role: "assistant", content: "_Stopped._" });
      return;
    }
    store.pushChat({ role: "assistant", content: (error as Error).message, error: true });
  } finally {
    store.setAgentRunning(false);
  }
}

export const QUICK_ACTIONS = [
  { id: "explain", label: "Explain", prompt: "Explain what this code does, its structure and key flows." },
  { id: "fix", label: "Fix", prompt: "Find the bug in this code and propose a minimal fix as a diff." },
  { id: "refactor", label: "Refactor", prompt: "Refactor this code for readability, structure and maintainability. Propose the change as a diff." },
  { id: "test", label: "Test", prompt: "Detect the project's test framework and generate unit tests for this code as a new test file." },
  { id: "review", label: "Review", prompt: "Perform a thorough code review with severity levels (critical / warning / good)." },
  { id: "document", label: "Document", prompt: "Add docstrings/comments and propose README documentation for this code." },
] as const;

export function quickActionPrompt(id: string, activePath: string | null, selection: string) {
  const action = QUICK_ACTIONS.find((a) => a.id === id);
  if (!action) return "";
  const target = selection
    ? `Selected code from ${activePath}:\n\n\`\`\`\n${selection}\n\`\`\``
    : activePath
      ? `Target file: ${activePath} (read it first).`
      : "No file is open — inspect the project first.";
  return `${action.prompt}\n\n${target}`;
}
