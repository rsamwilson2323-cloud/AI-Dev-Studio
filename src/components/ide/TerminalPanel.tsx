import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isDangerous, runShellCommand } from "@/lib/shell";
import { useIde } from "@/lib/ide-store";
import { toast } from "sonner";

export function TerminalPanel() {
  const terminals = useIde((s) => s.terminals);
  const activeTerminal = useIde((s) => s.activeTerminal);
  const { newTerminal, closeTerminal, setActiveTerminal, pushTerminal, clearTerminal, pushHistory, setTerminalCwd } =
    useIde.getState();
  const session = terminals.find((t) => t.id === activeTerminal) ?? terminals[0];
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [session?.lines.length]);

  if (!session) return null;

  const prompt = `~/${session.cwd || ""}`.replace(/\/$/, "");

  async function submit() {
    if (!session || busy) return;
    const command = input.trim();
    setInput("");
    setHistoryIndex(null);
    if (!command) return;
    pushTerminal(session.id, { text: `${prompt} $ ${command}`, tone: "in" });
    pushHistory(session.id, command);
    if (command === "clear") {
      clearTerminal(session.id);
      return;
    }
    if (isDangerous(command) && !window.confirm(`"${command}" is destructive. Run it against the workspace?`)) {
      pushTerminal(session.id, { text: "cancelled", tone: "muted" });
      return;
    }
    setBusy(true);
    try {
      await runShellCommand(command, {
        cwd: useIde.getState().terminals.find((t) => t.id === session.id)?.cwd ?? "",
        emit: (text, tone) => pushTerminal(session.id, { text, tone: tone ?? "out" }),
        setCwd: (next) => setTerminalCwd(session.id, next),
      });
    } catch (error) {
      pushTerminal(session.id, { text: `error: ${(error as Error).message}`, tone: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <div className="flex items-center gap-px border-b border-border">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={`group flex items-center gap-1.5 border-r border-border px-3 py-1.5 text-[11.5px] ${
              terminal.id === session.id ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-3"
            }`}
          >
            <button onClick={() => setActiveTerminal(terminal.id)}>{terminal.name}</button>
            {terminals.length > 1 && (
              <button onClick={() => closeTerminal(terminal.id)} aria-label={`Close ${terminal.name}`}>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => newTerminal(session.cwd)}
          aria-label="New terminal"
          title="New terminal"
          className="px-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="ml-2 truncate font-mono text-[10.5px] text-muted-foreground/70">{prompt}</span>
        <button
          onClick={() => clearTerminal(session.id)}
          aria-label="Clear terminal"
          title="Clear"
          className="ml-auto px-2 text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed">
        {session.lines.map((line) => (
          <div
            key={line.id}
            className={
              line.tone === "in"
                ? "text-primary"
                : line.tone === "err"
                  ? "text-destructive"
                  : line.tone === "muted"
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground"
            }
          >
            <span className="whitespace-pre-wrap">{line.text}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-primary">{prompt} $</span>
          <input
            value={input}
            aria-label="Terminal command"
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
              if (event.key === "ArrowUp") {
                event.preventDefault();
                const next = historyIndex === null ? session.history.length - 1 : Math.max(0, historyIndex - 1);
                if (session.history[next]) {
                  setHistoryIndex(next);
                  setInput(session.history[next]!);
                }
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (historyIndex === null) return;
                const next = historyIndex + 1;
                if (next >= session.history.length) {
                  setHistoryIndex(null);
                  setInput("");
                } else {
                  setHistoryIndex(next);
                  setInput(session.history[next]!);
                }
              }
              if (event.key === "l" && event.ctrlKey) {
                event.preventDefault();
                clearTerminal(session.id);
              }
            }}
            className="flex-1 bg-transparent outline-none disabled:opacity-60"
            placeholder={busy ? "running…" : "help"}
          />
        </div>
        <div ref={endRef} />
      </div>
      <p className="border-t border-border px-3 py-1 text-[10.5px] text-muted-foreground/70">
        Runs here: node/tsx, python, npm install/test/run dev, open index.html, run.bat, git status/diff/log.{" "}
        <button
          className="underline"
          onClick={() => toast.info("Code runs in your browser: JS/TS via Sucrase, Python via Pyodide, HTML in a live preview.")}
        >
          How does this run?
        </button>
      </p>
    </div>
  );
}
