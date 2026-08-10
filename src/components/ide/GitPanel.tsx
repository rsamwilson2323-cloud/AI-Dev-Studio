import { GitCommitHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import { DiffView } from "./DiffView";
import { gitChanges, useIde, type Workspace } from "@/lib/ide-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function GitPanel({ onAiReview }: { onAiReview: () => void }) {
  const state = useIde() as Workspace;
  const { stage, unstage, discard, commit, openTab } = useIde.getState();
  const changes = gitChanges(state);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      <div className="flex w-full max-w-sm flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Source Control</span>
          <button
            onClick={onAiReview}
            disabled={!changes.length}
            className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            <Sparkles className="h-3 w-3 text-primary" /> AI Review
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {!changes.length && <p className="px-3 py-4 text-[12px] text-muted-foreground">No changes detected.</p>}
          {changes.map((change) => {
            const staged = state.staged.includes(change.path);
            return (
              <div key={change.path} className="group flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-surface-3">
                <span
                  className={`font-mono text-[10px] ${
                    change.status === "A" ? "text-diff-add" : change.status === "D" ? "text-diff-del" : "text-status-warn"
                  }`}
                >
                  {change.status}
                </span>
                <button
                  onClick={() => {
                    setOpen(change.path);
                    if (change.status !== "D") openTab(change.path);
                  }}
                  className={`truncate font-mono ${open === change.path ? "text-foreground" : "text-muted-foreground"} hover:text-foreground`}
                >
                  {change.path}
                </button>
                <span className="ml-auto shrink-0 font-mono text-[10px]">
                  <span className="text-diff-add">+{change.additions}</span> <span className="text-diff-del">-{change.deletions}</span>
                </span>
                <div className="hidden shrink-0 gap-1 group-hover:flex">
                  <button
                    onClick={() => (staged ? unstage(change.path) : stage(change.path))}
                    className="rounded px-1 text-[10.5px] text-muted-foreground hover:text-foreground"
                  >
                    {staged ? "Unstage" : "Stage"}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Discard changes in ${change.path}?`)) discard(change.path);
                    }}
                    className="rounded px-1 text-[10.5px] text-destructive/80 hover:text-destructive"
                  >
                    Discard
                  </button>
                </div>
                {staged && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title="Staged" />}
              </div>
            );
          })}
        </div>
        <div className="space-y-2 border-t border-border p-2">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Commit message…"
            aria-label="Commit message"
            className="h-7 border-border bg-surface-1 text-[12px]"
          />
          <Button
            size="sm"
            className="h-7 w-full text-[11.5px]"
            disabled={!state.staged.length || !message.trim()}
            onClick={() => {
              commit(message);
              setMessage("");
              toast.success("Committed to the workspace history");
            }}
          >
            <GitCommitHorizontal className="mr-1 h-3.5 w-3.5" /> Commit {state.staged.length ? `(${state.staged.length})` : ""}
          </Button>
          {state.commits.length > 0 && (
            <div className="max-h-24 space-y-1 overflow-auto pt-1">
              {state.commits.map((entry) => (
                <p key={entry.id} className="truncate font-mono text-[10.5px] text-muted-foreground">
                  {entry.id.slice(0, 7)} {entry.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {open ? (
          <DiffView before={state.baseline[open] ?? ""} after={state.files[open]?.content ?? ""} className="h-full" />
        ) : (
          <p className="p-3 text-[12px] text-muted-foreground">Select a changed file to view its diff.</p>
        )}
      </div>
    </div>
  );
}
