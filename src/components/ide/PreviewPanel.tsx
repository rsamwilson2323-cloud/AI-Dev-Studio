import { RefreshCw, X } from "lucide-react";
import { buildPreview } from "@/lib/runtime";
import { useIde } from "@/lib/ide-store";

export function PreviewPanel() {
  const preview = useIde((s) => s.preview);
  const { setPreview } = useIde.getState();

  if (!preview) {
    return (
      <div className="grid h-full place-items-center bg-surface-1 px-4 text-center text-[12px] text-muted-foreground">
        Run <code className="mx-1 font-mono text-primary">npm run dev</code> or{" "}
        <code className="mx-1 font-mono text-primary">open index.html</code> in the terminal to preview your app.
      </div>
    );
  }

  const html = buildPreview(preview.path) ?? "<p>Preview unavailable.</p>";

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="truncate font-mono text-[11.5px] text-muted-foreground">{preview.path}</span>
        <button
          onClick={() => setPreview({ ...preview, nonce: Date.now() })}
          aria-label="Reload preview"
          className="ml-auto rounded p-1 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setPreview(null)}
          aria-label="Close preview"
          className="rounded p-1 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <iframe key={preview.nonce} title="App preview" srcDoc={html} className="min-h-0 flex-1 bg-white" sandbox="allow-scripts allow-forms" />
    </div>
  );
}
