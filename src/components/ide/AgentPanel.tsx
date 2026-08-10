import { Bot, Check, ChevronDown, Loader2, Paperclip, Send, Sparkles, Square, Trash2, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { DiffView } from "./DiffView";
import { QUICK_ACTIONS, quickActionPrompt, resetConversation, runAgent } from "@/lib/agent";
import { useIde } from "@/lib/ide-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SAMPLES = [
  "Explain this project",
  "Find bugs in this project",
  "Generate tests for src/utils.js",
  "Review my Git changes",
  "Create a README section for the API",
  "Find security issues",
];

export function AgentPanel({ selection, onOpenSettings }: { selection: string; onOpenSettings: () => void }) {
  const chat = useIde((s) => s.chat);
  const activity = useIde((s) => s.activity);
  const pending = useIde((s) => s.pending);
  const running = useIde((s) => s.agentRunning);
  const active = useIde((s) => s.active);
  const apiKey = useIde((s) => s.settings.apiKey);
  const model = useIde((s) => s.settings.model);
  const { openTab, requestJump, applyChange, rejectChange, applyAllChanges, rejectAllChanges, clearChat } = useIde.getState();

  const [input, setInput] = useState("");
  const [attachFile, setAttachFile] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, activity, pending]);

  useEffect(() => {
    if (!running) inputRef.current?.focus();
  }, [running]);

  async function send(prompt: string) {
    if (!prompt.trim() || running) return;
    if (!apiKey) {
      toast.error("Add your Groq API key in Settings first.");
      onOpenSettings();
      return;
    }
    const attachment = attachFile && active ? `\n\n(Context: the user is looking at ${active})` : "";
    const controller = new AbortController();
    abortRef.current = controller;
    setInput("");
    await runAgent(prompt + attachment, controller.signal);
  }

  const openRef = (path: string, line?: number) => {
    if (!useIde.getState().files[path]) return;
    openTab(path);
    if (line) requestJump(path, line);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-foreground">AI Developer</p>
            <p className="font-mono text-[10.5px] text-muted-foreground">{model}</p>
          </div>
        </div>
        <button
          onClick={() => {
            clearChat();
            resetConversation();
          }}
          title="Clear conversation"
          aria-label="Clear conversation"
          className="rounded p-1 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => void send(quickActionPrompt(action.id, active, selection))}
            disabled={running}
            className="rounded border border-border bg-surface-1 px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
        {!chat.length && (
          <div className="space-y-3">
            <p className="text-[12.5px] text-muted-foreground">Ask me anything about your project.</p>
            <div className="flex flex-col gap-1">
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  onClick={() => void send(sample)}
                  className="flex items-center gap-2 rounded border border-border bg-surface-1 px-2.5 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="ml-auto max-w-[92%] rounded-lg rounded-br-sm bg-primary/15 px-3 py-2 text-[12.5px] text-foreground">
              {message.content.split("\n\n(Context:")[0]}
            </div>
          ) : (
            <div
              key={message.id}
              className={`max-w-full rounded-lg border px-3 py-2 ${
                message.error ? "border-destructive/40 bg-destructive/10" : "border-border bg-surface-1"
              }`}
            >
              {message.error ? (
                <div className="space-y-2">
                  <p className="text-[12.5px] text-destructive">{message.content}</p>
                  <Button size="sm" variant="outline" onClick={onOpenSettings} className="h-7 text-[11.5px]">
                    Open Settings
                  </Button>
                </div>
              ) : (
                <Markdown text={message.content || "…"} onOpenRef={openRef} />
              )}
              {message.streaming && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> streaming
                </div>
              )}
            </div>
          ),
        )}

        {activity.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-1">
            <button
              onClick={() => setShowActivity((value) => !value)}
              className="flex w-full items-center justify-between px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              AI Activity
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showActivity ? "" : "-rotate-90"}`} />
            </button>
            {showActivity && (
              <ul className="space-y-1 px-3 pb-2">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    {item.status === "running" && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />}
                    {item.status === "done" && <Check className="h-3 w-3 shrink-0 text-diff-add" />}
                    {item.status === "warn" && <TriangleAlert className="h-3 w-3 shrink-0 text-status-warn" />}
                    {item.status === "fail" && <X className="h-3 w-3 shrink-0 text-destructive" />}
                    <span className="truncate">{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {pending.length > 0 && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="text-[12.5px] font-semibold text-foreground">
              AI wants to change {pending.length} {pending.length === 1 ? "file" : "files"}
            </p>
            <ul className="mt-2 space-y-1">
              {pending.map((change) => (
                <li key={change.id} className="rounded border border-border bg-surface-1">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span
                      className={`font-mono text-[10px] ${
                        change.kind === "create" ? "text-diff-add" : change.kind === "delete" ? "text-diff-del" : "text-status-warn"
                      }`}
                    >
                      {change.kind === "create" ? "A" : change.kind === "delete" ? "D" : "M"}
                    </span>
                    <button
                      onClick={() => setReviewing(reviewing === change.id ? null : change.id)}
                      className="truncate font-mono text-[11.5px] text-muted-foreground hover:text-foreground"
                    >
                      {change.path}
                    </button>
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => rejectChange(change.id)}
                        className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-surface-3"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          applyChange(change.id);
                          openTab(change.path);
                          toast.success(`Applied ${change.path}`);
                        }}
                        className="rounded bg-primary px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  {reviewing === change.id && (
                    <DiffView before={change.before ?? ""} after={change.after ?? ""} className="max-h-64 rounded-none border-0 border-t" />
                  )}
                </li>
              ))}
            </ul>
            {pending.length > 1 && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" className="h-7 flex-1 text-[11.5px]" onClick={applyAllChanges}>
                  Apply all
                </Button>
                <Button size="sm" variant="outline" className="h-7 flex-1 text-[11.5px]" onClick={rejectAllChanges}>
                  Reject all
                </Button>
              </div>
            )}
          </div>
        )}

        {running && !chat.some((m) => m.streaming) && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border p-2">
        <div className="rounded-lg border border-border bg-surface-1 focus-within:border-primary/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            aria-label="Ask the AI about your project"
            placeholder="Ask AI about your project…"
            className="w-full resize-none bg-transparent px-3 py-2 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2 px-2 pb-2">
            <button
              onClick={() => setAttachFile((value) => !value)}
              title="Attach the active file as context"
              className={`flex items-center gap-1 rounded px-1.5 py-1 text-[11px] ${
                attachFile ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-3"
              }`}
            >
              <Paperclip className="h-3 w-3" />
              {active ? active.split("/").pop() : "no file"}
            </button>
            {selection && <span className="text-[11px] text-muted-foreground">{selection.split("\n").length} lines selected</span>}
            <div className="ml-auto">
              {running ? (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="flex items-center gap-1 rounded bg-destructive px-2 py-1 text-[11.5px] font-medium text-destructive-foreground"
                >
                  <Square className="h-3 w-3" /> Stop
                </button>
              ) : (
                <button
                  onClick={() => void send(input)}
                  disabled={!input.trim()}
                  className="flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground disabled:opacity-40"
                >
                  <Send className="h-3 w-3" /> Send
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
