import Editor, { type OnMount } from "@monaco-editor/react";
import { Save, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { fileLanguage, useIde } from "@/lib/ide-store";
import { toast } from "sonner";

type MonacoEditor = Parameters<OnMount>[0];

export function EditorArea({ onSelectionChange }: { onSelectionChange: (text: string) => void }) {
  const active = useIde((s) => s.active);
  const tabs = useIde((s) => s.tabs);
  const files = useIde((s) => s.files);
  const buffers = useIde((s) => s.buffers);
  const settings = useIde((s) => s.settings);
  const jump = useIde((s) => s.jumpToLine);
  const { setActive, closeTab, setBuffer, saveTab } = useIde.getState();
  const editorRef = useRef<MonacoEditor | null>(null);

  const content = active ? (buffers[active] ?? files[active]?.content ?? "") : "";

  useEffect(() => {
    if (!jump || !editorRef.current || jump.path !== active) return;
    editorRef.current.revealLineInCenter(jump.line);
    editorRef.current.setPosition({ lineNumber: jump.line, column: 1 });
    editorRef.current.focus();
  }, [jump, active]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("studio-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#161b22",
        "editorGutter.background": "#161b22",
        "editor.lineHighlightBackground": "#1d2430",
        "editorLineNumber.foreground": "#5a6472",
      },
    });
    monaco.editor.setTheme("studio-dark");
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      onSelectionChange(selection && model ? model.getValueInRange(selection) : "");
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const path = useIde.getState().active;
      if (path) {
        saveTab(path);
        toast.success(`Saved ${path}`);
      }
    });
  };

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-surface-2 text-center">
        <p className="text-[13px] text-muted-foreground">Select a file to start coding.</p>
        <p className="text-[11.5px] text-muted-foreground/70">Ctrl + P for quick open · Ctrl + Shift + P for the command palette</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-2">
      <div className="flex items-center gap-px overflow-x-auto border-b border-border bg-surface-1">
        {tabs.map((tab) => {
          const dirty = buffers[tab] !== undefined;
          return (
            <div
              key={tab}
              className={`group flex shrink-0 items-center gap-2 border-r border-border px-3 py-1.5 text-[12.5px] ${
                active === tab ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-3"
              }`}
            >
              <button onClick={() => setActive(tab)} className="flex items-center gap-1.5" aria-label={`Open ${tab}`}>
                {dirty && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                <span className="font-mono">{tab.split("/").pop()}</span>
              </button>
              <button
                onClick={() => closeTab(tab)}
                aria-label={`Close ${tab}`}
                className="rounded p-0.5 opacity-0 transition-opacity hover:bg-surface-3 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-2 px-3">
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">{active}</span>
          <button
            onClick={() => {
              saveTab(active);
              toast.success(`Saved ${active}`);
            }}
            disabled={buffers[active] === undefined}
            title="Save (Ctrl+S)"
            className="flex items-center gap-1 rounded px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-surface-3 hover:text-foreground disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          key={active}
          language={fileLanguage(active)}
          value={content}
          theme="studio-dark"
          onMount={handleMount}
          onChange={(value) => setBuffer(active, value ?? "")}
          loading={<div className="p-4 text-[12px] text-muted-foreground">Loading editor…</div>}
          options={{
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: settings.wordWrap ? "on" : "off",
            minimap: { enabled: settings.minimap },
            lineNumbers: settings.lineNumbers ? "on" : "off",
            fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            renderLineHighlight: "all",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
