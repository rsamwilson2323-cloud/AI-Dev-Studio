import { FolderPlus, FolderUp, PanelLeft, PanelRight, Settings, Sparkles, TerminalSquare, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoProject, templateFiles, templates, type TemplateId } from "@/lib/sample-project";
import { importFiles, pickFiles } from "@/lib/upload";
import { useIde } from "@/lib/ide-store";
import { toast } from "sonner";

export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const projectName = useIde((s) => s.projectName);
  const panels = useIde((s) => s.panels);
  const { openProject, togglePanel } = useIde.getState();

  function newProject(id: TemplateId) {
    const name = window.prompt("Project name", id === "empty" ? "my-project" : `${id}-app`);
    if (!name) return;
    openProject(name, templateFiles(id, name), id);
  }

  async function upload(directory: boolean) {
    const picked = await pickFiles(directory);
    if (!picked || !picked.length) return;
    const report = await importFiles(picked);
    if (!report.added) toast.error("Nothing imported — only text/code files under 2 MB are supported.");
    else
      toast.success(`Imported ${report.added} file${report.added === 1 ? "" : "s"}`, {
        description: report.skipped.length ? `Skipped ${report.skipped.length} binary or oversized file(s).` : undefined,
      });
  }


  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface-1 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded bg-primary/15 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h1 className="text-[13px] font-semibold tracking-tight">AI Dev Studio</h1>
      </div>
      <span className="ml-2 truncate font-mono text-[11.5px] text-muted-foreground">{projectName ?? "no project"}</span>
      <div className="ml-auto flex items-center gap-1">
        {templates.slice(0, 4).map((template) => (
          <button
            key={template.id}
            onClick={() => newProject(template.id)}
            className="hidden rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground md:block"
          >
            {template.label}
          </button>
        ))}
        <Button size="sm" variant="outline" className="h-7 text-[11.5px]" onClick={() => void upload(false)}>
          <Upload className="mr-1 h-3.5 w-3.5" /> Upload files
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11.5px]" onClick={() => void upload(true)}>
          <FolderUp className="mr-1 h-3.5 w-3.5" /> Upload folder
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11.5px]" onClick={() => openProject("demo-auth-app", demoProject(), "demo")}>
          <FolderPlus className="mr-1 h-3.5 w-3.5" /> Demo project
        </Button>
        <button onClick={() => togglePanel("explorer")} aria-label="Toggle explorer" className={`rounded p-1.5 ${panels.explorer ? "text-foreground" : "text-muted-foreground"} hover:bg-surface-3`}>
          <PanelLeft className="h-4 w-4" />
        </button>
        <button onClick={() => togglePanel("bottom")} aria-label="Toggle terminal" className={`rounded p-1.5 ${panels.bottom ? "text-foreground" : "text-muted-foreground"} hover:bg-surface-3`}>
          <TerminalSquare className="h-4 w-4" />
        </button>
        <button onClick={() => togglePanel("agent")} aria-label="Toggle AI panel" className={`rounded p-1.5 ${panels.agent ? "text-foreground" : "text-muted-foreground"} hover:bg-surface-3`}>
          <PanelRight className="h-4 w-4" />
        </button>
        <button onClick={onOpenSettings} aria-label="Settings" className="rounded p-1.5 text-muted-foreground hover:bg-surface-3 hover:text-foreground">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
