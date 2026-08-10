import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/ide/TopBar";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { EditorArea } from "@/components/ide/EditorArea";
import { AgentPanel } from "@/components/ide/AgentPanel";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { GitPanel } from "@/components/ide/GitPanel";
import { PreviewPanel } from "@/components/ide/PreviewPanel";
import { SettingsDialog } from "@/components/ide/SettingsDialog";
import { Toaster } from "@/components/ui/sonner";
import { useIde } from "@/lib/ide-store";

export const Route = createFileRoute("/")({
  component: Studio,
  head: () => ({
    meta: [
      { title: "AI Dev Studio — AI-Powered Code Workspace" },
      {
        name: "description",
        content: "An AI developer workspace with a file explorer, Monaco editor, agent with tools, terminal, and Git-style diff review.",
      },
      { property: "og:title", content: "AI Dev Studio — AI-Powered Code Workspace" },
      { property: "og:description", content: "Browse files, edit code, and let an AI agent read, search, and rewrite your project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Studio() {
  const panels = useIde((s) => s.panels);
  const bottomTab = useIde((s) => s.bottomTab);
  const accent = useIde((s) => s.settings.accent);
  const { setBottomTab, togglePanel } = useIde.getState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selection, setSelection] = useState("");

  useEffect(() => {
    document.documentElement.dataset["accent"] = accent;
  }, [accent]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        togglePanel("explorer");
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "`") {
        event.preventDefault();
        togglePanel("bottom");
      }
      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePanel]);

  const tabs: { id: typeof bottomTab; label: string }[] = [
    { id: "terminal", label: "Terminal" },
    { id: "preview", label: "Preview" },
    { id: "git", label: "Source Control" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-2 text-foreground">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="flex min-h-0 flex-1">
        {panels.explorer && (
          <aside className="w-60 shrink-0 border-r border-border">
            <FileExplorer />
          </aside>
        )}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <EditorArea onSelectionChange={setSelection} />
          </div>
          {panels.bottom && (
            <div className="h-64 shrink-0 border-t border-border">
              <div className="flex items-center gap-px border-b border-border bg-surface-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setBottomTab(tab.id)}
                    className={`px-3 py-1.5 text-[11.5px] ${bottomTab === tab.id ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-3"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="h-[calc(100%-30px)]">
                {bottomTab === "git" ? (
                  <GitPanel onAiReview={() => togglePanel("agent")} />
                ) : bottomTab === "preview" ? (
                  <PreviewPanel />
                ) : (
                  <TerminalPanel />
                )}
              </div>
            </div>
          )}
        </section>
        {panels.agent && (
          <aside className="w-[26rem] shrink-0 border-l border-border">
            <AgentPanel selection={selection} onOpenSettings={() => setSettingsOpen(true)} />
          </aside>
        )}
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster />
    </div>
  );
}
